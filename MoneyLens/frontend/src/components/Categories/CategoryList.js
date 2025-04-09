import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AddCategory from './AddCategory';

function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [refreshCategories, setRefreshCategories] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get('/categories', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setCategories(response.data);
        } catch (error) {
          console.error('Error fetching categories:', error.response ? error.response.data : error.message);
        }
      }
    };

    fetchCategories();
    setRefreshCategories(false); // Reset refresh state
  }, [refreshCategories]);

  const handleDeleteCategory = async (id) => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await axios.delete(`/categories/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        alert('Category deleted successfully!');
        setRefreshCategories(true); // Trigger refresh
      } catch (error) {
        console.error('Error deleting category:', error.response ? error.response.data : error.message);
        alert(`Error deleting category: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleCategoryAdded = () => {
    setRefreshCategories(true); // Trigger refresh after adding a category
  };

  return (
    <div>
      <h3>Categories</h3>
      <AddCategory onCategoryAdded={handleCategoryAdded} />
      <ul>
        {categories.map((category) => (
          <li key={category.id}>
            {category.name} <button onClick={() => handleDeleteCategory(category.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CategoryList;