# backend/app.py
from flask import Flask, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_wtf.csrf import CSRFProtect, generate_csrf
from datetime import datetime, timedelta
import jwt
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Transaction, Category, Budget
import os
from io import StringIO
import csv
from sqlalchemy import or_
from flask_cors import CORS
from flask_cors import CORS

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///site.db')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your_secret_key') # Replace with a strong, secret key
csrf = CSRFProtect(app)
db.init_app(app)
migrate = Migrate(app, db)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000", "supports_credentials": True}}) # Explicit CORS configuration# Function to generate a JWT token
def generate_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')
    return token

# Function to verify the JWT token
def verify_token():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return User.query.get(payload['user_id'])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

# Decorator for protected routes
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = verify_token()
        if not user:
            return jsonify({'message': 'Authentication required'}), 401
        return f(user, *args, **kwargs)
    return decorated

# User Registration
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({'message': 'Missing required fields'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'Username already exists'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email already exists'}), 400

    new_user = User(username=username, email=email)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'Registration successful'}), 201

# User Login
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Missing required fields'}), 400

    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        token = generate_token(user.id)
        return jsonify({'token': token}), 200
    else:
        return jsonify({'message': 'Invalid username or password'}), 401

# Get CSRF Token (for frontend security)
@app.route('/csrf_token', methods=['GET'])
def get_csrf_token():
    token = generate_csrf()
    print(f"Backend CSRF Token generated: {token}") # Added this line
    return jsonify({'csrf_token': token})

# Dashboard Data
@app.route('/dashboard', methods=['GET'])
@token_required
def dashboard(current_user):
    now = datetime.utcnow()
    current_month = now.month
    current_year = now.year
    monthly_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_end = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0) + timedelta(days=31)

    income = db.session.query(db.func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == 'Income',
        Transaction.date >= monthly_start,
        Transaction.date < monthly_end
    ).scalar() or 0

    expenses = db.session.query(db.func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == 'Expense',
        Transaction.date >= monthly_start,
        Transaction.date < monthly_end
    ).scalar() or 0

    balance = income - expenses

    expense_breakdown = db.session.query(Category.name, db.func.sum(Transaction.amount)).join(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == 'Expense',
        Transaction.date >= monthly_start,
        Transaction.date < monthly_end
    ).group_by(Category.name).all()
    expense_breakdown_data = [{'category': name, 'amount': amount} for name, amount in expense_breakdown]

    # Get current month's budgets
    budgets = Budget.query.filter_by(user_id=current_user.id, month=current_month, year=current_year).all()
    budget_data = []
    for budget in budgets:
        category = Category.query.get(budget.category_id)
        if category:
            spent = db.session.query(db.func.sum(Transaction.amount)).filter(
                Transaction.user_id == current_user.id,
                Transaction.category_id == budget.category_id,
                Transaction.type == 'Expense',
                Transaction.date >= monthly_start,
                Transaction.date < monthly_end
            ).scalar() or 0
            budget_data.append({'category': category.name, 'limit': budget.monthly_limit, 'spent': spent})

    trend_data = [] # Placeholder

    return jsonify({
        'total_income': income,
        'total_expenses': expenses,
        'balance': balance,
        'expense_breakdown': expense_breakdown_data,
        'trend_data': trend_data,
        'budget_vs_actual': budget_data
    }), 200

# Transaction Management
@app.route('/transactions', methods=['GET', 'POST'])
@token_required
def transactions(current_user):
    if request.method == 'GET':
        transactions = Transaction.query.filter_by(user_id=current_user.id).all()
        transaction_list = [{
            'id': t.id,
            'title': t.title,
            'amount': t.amount,
            'type': t.type,
            'date': t.date.isoformat(),
            'category': t.category.name,
            'description': t.description
        } for t in transactions]
        return jsonify(transaction_list), 200
    elif request.method == 'POST':
        data = request.get_json()
        title = data.get('title')
        amount = data.get('amount')
        type = data.get('type')
        date_str = data.get('date')
        category_name = data.get('category')
        description = data.get('description')

        if not title or amount is None or not type or not date_str or not category_name:
            return jsonify({'message': 'Missing required fields'}), 400

        try:
            date = datetime.fromisoformat(date_str)
        except ValueError:
            return jsonify({'message': 'Invalid date format'}), 400

        category = Category.query.filter_by(name=category_name, user_id=current_user.id).first()
        if not category:
            return jsonify({'message': 'Category not found'}), 404

        new_transaction = Transaction(title=title, amount=amount, type=type, date=date,
                                      category_id=category.id, user_id=current_user.id, description=description)
        db.session.add(new_transaction)
        db.session.commit()
        return jsonify({'message': 'Transaction added successfully'}), 201

@app.route('/transactions/<int:transaction_id>', methods=['GET', 'PUT', 'DELETE'])
@token_required
def transaction(current_user, transaction_id):
    transaction = Transaction.query.filter_by(id=transaction_id, user_id=current_user.id).first()
    if not transaction:
        return jsonify({'message': 'Transaction not found'}), 404

    if request.method == 'GET':
        return jsonify({
            'id': transaction.id,
            'title': transaction.title,
            'amount': transaction.amount,
            'type': transaction.type,
            'date': transaction.date.isoformat(),
            'category': transaction.category.name,
            'description': transaction.description
        }), 200
    elif request.method == 'PUT':
        data = request.get_json()
        transaction.title = data.get('title', transaction.title)
        transaction.amount = data.get('amount', transaction.amount)
        transaction.type = data.get('type', transaction.type)
        date_str = data.get('date')
        category_name = data.get('category', transaction.category.name)
        transaction.description = data.get('description', transaction.description)

        if date_str:
            try:
                transaction.date = datetime.fromisoformat(date_str)
            except ValueError:
                return jsonify({'message': 'Invalid date format'}), 400

        if category_name != transaction.category.name:
            category = Category.query.filter_by(name=category_name, user_id=current_user.id).first()
            if not category:
                return jsonify({'message': 'Category not found'}), 404
            transaction.category_id = category.id

        db.session.commit()
        return jsonify({'message': 'Transaction updated successfully'}), 200
    elif request.method == 'DELETE':
        db.session.delete(transaction)
        db.session.commit()
        return jsonify({'message': 'Transaction deleted successfully'}), 200

# Categories Module
@app.route('/categories', methods=['GET', 'POST'])
@token_required
def categories(current_user):
    if request.method == 'GET':
        categories = Category.query.filter_by(user_id=current_user.id).all()
        category_list = [{'id': c.id, 'name': c.name} for c in categories]
        return jsonify(category_list), 200
    elif request.method == 'POST':
        data = request.get_json()
        name = data.get('name')
        if not name:
            return jsonify({'message': 'Category name cannot be empty'}), 400
        if Category.query.filter_by(name=name, user_id=current_user.id).first():
            return jsonify({'message': 'Category already exists'}), 400
        new_category = Category(name=name, user_id=current_user.id)
        db.session.add(new_category)
        db.session.commit()
        return jsonify({'message': 'Category added successfully'}), 201

@app.route('/categories/<int:category_id>', methods=['DELETE'])
@token_required
def category(current_user, category_id):
    category = Category.query.filter_by(id=category_id, user_id=current_user.id).first()
    if not category:
        return jsonify({'message': 'Category not found'}), 404
    db.session.delete(category)
    db.session.commit()
    return jsonify({'message': 'Category deleted successfully'}), 200

# Budget Planner
@app.route('/budgets', methods=['GET'])
@token_required
def get_budgets(current_user):
    budgets = Budget.query.filter_by(user_id=current_user.id).all()
    budget_list = [{'id': b.id, 'category_id': b.category_id,
                    'category_name': Category.query.get(b.category_id).name if Category.query.get(b.category_id) else None,
                    'monthly_limit': b.monthly_limit, 'month': b.month, 'year': b.year} for b in budgets]
    return jsonify(budget_list), 200

@app.route('/budgets', methods=['POST'])
@token_required
def add_budget(current_user):
    data = request.get_json()
    category_name = data.get('category')
    monthly_limit = data.get('monthly_limit')
    month = data.get('month')
    year = data.get('year')

    if not category_name or monthly_limit is None or month is None or year is None:
        return jsonify({'message': 'Missing required fields'}), 400

    category = Category.query.filter_by(name=category_name, user_id=current_user.id).first()
    if not category:
        return jsonify({'message': 'Category not found'}), 404

    existing_budget = Budget.query.filter_by(user_id=current_user.id, category_id=category.id, month=month, year=year).first()

    if existing_budget:
        existing_budget.monthly_limit = monthly_limit
        db.session.commit()
        return jsonify({'message': 'Budget updated successfully'}), 200
    else:
        new_budget = Budget(user_id=current_user.id, category_id=category.id,
                           monthly_limit=monthly_limit, month=month, year=year)
        db.session.add(new_budget)
        db.session.commit()
        return jsonify({'message': 'Budget added successfully'}), 201

# Data Export
@app.route('/export', methods=['GET'])
@token_required
def export_transactions(current_user):
    transactions = Transaction.query.filter_by(user_id=current_user.id).all()

    # Prepare CSV data
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(['Title', 'Amount', 'Type', 'Date', 'Category', 'Description']) # Header row
    for transaction in transactions:
        writer.writerow([transaction.title, transaction.amount, transaction.type,
                         transaction.date.isoformat(), transaction.category.name,
                         transaction.description if transaction.description else ''])

    csv_data = output.getvalue()
    output.close()

    # Send CSV file
    return send_file(StringIO(csv_data), mimetype='text/csv', as_attachment=True,
                     download_name='transactions.csv')

# Date Filtering & Search
@app.route('/transactions/filter', methods=['GET'])
@token_required
def filter_transactions(current_user):
    month = request.args.get('month')
    year = request.args.get('year')
    category_name = request.args.get('category')
    search_term = request.args.get('search')

    query = Transaction.query.filter_by(user_id=current_user.id)

    if month and year:
        try:
            month = int(month)
            year = int(year)
            query = query.filter(db.extract('month', Transaction.date) == month,
                                 db.extract('year', Transaction.date) == year)
        except ValueError:
            return jsonify({'message': 'Invalid month or year format'}), 400

    if category_name:
        category = Category.query.filter_by(name=category_name, user_id=current_user.id).first()
        if category:
            query = query.filter(Transaction.category_id == category.id)
        else:
            return jsonify({'message': 'Category not found'}), 404

    if search_term:
        query = query.filter(or_(Transaction.title.ilike(f'%{search_term}%'),
                                   Transaction.description.ilike(f'%{search_term}%')))

    transactions = query.all()
    transaction_list = [{
        'id': t.id,
        'title': t.title,
        'amount': t.amount,
        'type': t.type,
        'date': t.date.isoformat(),
        'category': t.category.name,
        'description': t.description
    } for t in transactions]
    return jsonify(transaction_list), 200

# Spending Suggestions (Basic Placeholder)
@app.route('/suggestions', methods=['GET'])
@token_required
def suggestions(current_user):
    # Basic placeholder for spending suggestions
    return jsonify({'suggestions': ['You\'ve spent more than usual on dining.']}), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)