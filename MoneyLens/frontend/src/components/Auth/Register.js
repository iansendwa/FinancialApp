// frontend/src/components/Auth/Register.js
import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    const fetchCSRFToken = async () => {
      try {
        const response = await api.get('/csrf_token');
        setCsrfToken(response.data.csrf_token);
      } catch (error) {
        console.error('Error fetching CSRF token:', error.response ? error.response.data : error.message);
        alert('Could not fetch CSRF token.');
      }
    };

    fetchCSRFToken();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (csrfToken) {
      const tokenToSend = csrfToken; // Get the current value
      console.log('CSRF Token being sent:', tokenToSend);
      try {
        await api.post(
          '/register',
          { username, email, password },
          {
            headers: {
              'X-CSRFToken': tokenToSend,
            },
          }
        );
        alert('Registration successful! Please log in.');
        navigate('/login');
      } catch (error) {
        console.error('Registration failed:', error.response ? error.response.data : error.message);
        alert(`Registration failed: ${error.response?.data?.message || error.message}`);
      }
    } else {
      alert('CSRF token not available. Please try again.');
    }
  };
  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default Register;