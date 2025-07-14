import http from 'k6/http';
import { check, sleep, group } from 'k6';

// Define options for the test
export let options = {
    vus: 1,
    iterations: 1,
};

// Base URL and test user credentials
// Use environment variable for BASE_URL or default to a local server
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TEST_USER = {
    email: 'test@example.com',
    password: 'Aa123456'
};

export default function () {
    let token, user, fridgeId, cookbookId;

    // Login
    group('Login', function () {
        const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(TEST_USER), {
            headers: { 'Content-Type': 'application/json' }
        });
        check(loginRes, { 'login status 200': (r) => r.status === 200 });
        token = loginRes.json('accessToken');
        if (!token) throw new Error('Login failed, no token returned');
    });

    // Fetch user data
    group('Fetch user data', function () {
        const userRes = http.get(`${BASE_URL}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        check(userRes, { 'user fetch 200': (r) => r.status === 200 });
        user = userRes.json();
        fridgeId = user.fridgeId;
        cookbookId = user.cookbookId;
        if (!fridgeId) throw new Error('No fridgeId found in user data');
        if (!cookbookId) throw new Error('No cookbookId found in user data');
    });

    // Add ingredient to fridge
    group('Add ingredient to fridge', function () {
        const ingredient = {
            id: "10000000",
            name: "Apple",
            category: "Fruits",
            imageURL: "",
            quantity: 1
        };
        const addIngRes = http.post(`${BASE_URL}/api/fridge/${fridgeId}/items`, JSON.stringify(ingredient), {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('Add ingredient response:', addIngRes.status, addIngRes.body);
        check(addIngRes, {
            'add ingredient 201 or 400': (r) => r.status === 201 || r.status === 400
        });
    });

    // Generate recipe
    group('Generate recipe', function () {
        const genRecipeRes = http.post(`${BASE_URL}/api/recipes/`, JSON.stringify({
            ingredients: [{ name: "Apple" }]
        }), {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('Generate recipe response:', genRecipeRes.status, genRecipeRes.body);
        check(genRecipeRes, {
            'generate recipe 200': (r) => r.status === 200
        });
    });    

    sleep(1);
}