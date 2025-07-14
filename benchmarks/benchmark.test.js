import http from 'k6/http';
import { check, sleep, group } from 'k6';

export let options = {
    vus: 1,
    iterations: 1,
};

const BASE_URL = 'http://localhost:3000';
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

    // Add and remove recipe from cookbook
    group('Add and remove recipe from cookbook', function () {
        const hardcodedRecipe = {
            title: "Test Apple Pie",
            description: "A simple apple pie recipe for testing.",
            mealType: "Dessert",
            cuisineType: "American",
            difficulty: "Easy",
            prepTime: "15 min",
            cookingTime: "45 min",
            ingredients: [
                { name: "Apple" },
                { name: "Sugar" },
                { name: "Flour" }
            ],
            instructions: [
                "Preheat oven to 180C.",
                "Mix apples, sugar, and flour.",
                "Bake for 45 minutes."
            ],
            imageURL: "",
            rating: 0.0,
            source: "test",
            raw: "Test Apple Pie: Preheat oven to 180C. Mix apples, sugar, and flour. Bake for 45 minutes."
        };

        const addCookbookRes = http.post(
            `${BASE_URL}/api/cookbook/${cookbookId}/recipes`,
            JSON.stringify(hardcodedRecipe),
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('Add to cookbook response:', addCookbookRes.status, addCookbookRes.body);
        check(addCookbookRes, { 'add to cookbook 200': (r) => r.status === 200 });

        // Remove the recipe
        const addedCookbook = addCookbookRes.json('cookbook');
        const recipesArr = addedCookbook?.recipes;
        const recipeId = recipesArr && recipesArr.length > 0 ? recipesArr[recipesArr.length - 1]._id : undefined;

        if (recipeId) {
            const removeCookbookRes = http.del(
                `${BASE_URL}/api/cookbook/${cookbookId}/recipes/${recipeId}`,
                null,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                }
            );
            console.log('Remove from cookbook response:', removeCookbookRes.status, removeCookbookRes.body);
            check(removeCookbookRes, { 'remove from cookbook 200': (r) => r.status === 200 });
        }
    });

    sleep(1);
}