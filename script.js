diff --git a/script.js b/script.js
new file mode 100644
index 0000000000000000000000000000000000000000..aa56d830e9107af7f95b81b60c13759ff2dc857f
--- /dev/null
+++ b/script.js
@@ -0,0 +1,276 @@
+document.addEventListener('DOMContentLoaded', () => {
+    const scrollButtons = document.querySelectorAll('[data-scroll]');
+    const menuToggle = document.querySelector('.menu-toggle');
+    const navList = document.querySelector('.navbar ul');
+    const modal = document.getElementById('premium-modal');
+    const modalBody = document.getElementById('modal-body');
+    const closeModalBtn = document.querySelector('.close-modal');
+    let pendingCalories = null;
+
+    // Smooth scroll buttons
+    scrollButtons.forEach(btn => {
+        btn.addEventListener('click', () => {
+            const target = document.querySelector(btn.dataset.scroll);
+            target?.scrollIntoView({ behavior: 'smooth' });
+        });
+    });
+
+    // Mobile nav toggle
+    menuToggle.addEventListener('click', () => {
+        navList.classList.toggle('show');
+    });
+
+    navList.querySelectorAll('a').forEach(link => {
+        link.addEventListener('click', () => navList.classList.remove('show'));
+    });
+
+    // Macro calculator
+    const macroForm = document.getElementById('macro-form');
+    macroForm.addEventListener('submit', (e) => {
+        e.preventDefault();
+        const sex = macroForm.macroSex.value;
+        const age = Number(document.getElementById('macro-age').value);
+        const height = Number(document.getElementById('macro-height').value);
+        const weight = Number(document.getElementById('macro-weight').value);
+        const activity = Number(document.getElementById('macro-activity').value);
+        const goal = document.getElementById('macro-goal').value;
+        const errorBox = document.getElementById('macro-error');
+        errorBox.textContent = '';
+
+        if ([age, height, weight].some(val => val <= 0 || Number.isNaN(val))) {
+            errorBox.textContent = 'Please provide valid positive numbers for age, height, and weight.';
+            return;
+        }
+
+        const tdee = calculateTDEE({ sex, age, height, weight, activity });
+        const goalCalories = adjustCaloriesForGoal(tdee, goal);
+        const macros = calculateMacros(weight, goalCalories);
+        const macroResult = document.getElementById('macro-result');
+        macroResult.innerHTML = `
+            <h4>Suggested daily calories: <span>${Math.round(goalCalories)} kcal</span></h4>
+            <p>Protein: <strong>${macros.protein} g</strong></p>
+            <p>Carbs: <strong>${macros.carbs} g</strong></p>
+            <p>Fats: <strong>${macros.fats} g</strong></p>
+        `;
+        showPremiumOffer(goalCalories, 'macro-upsell');
+    });
+
+    // TDEE calculator
+    const tdeeForm = document.getElementById('tdee-form');
+    tdeeForm.addEventListener('submit', (e) => {
+        e.preventDefault();
+        const sex = tdeeForm.tdeeSex.value;
+        const age = Number(document.getElementById('tdee-age').value);
+        const height = Number(document.getElementById('tdee-height').value);
+        const weight = Number(document.getElementById('tdee-weight').value);
+        const activity = Number(document.getElementById('tdee-activity').value);
+        const errorBox = document.getElementById('tdee-error');
+        errorBox.textContent = '';
+
+        if ([age, height, weight].some(val => val <= 0 || Number.isNaN(val))) {
+            errorBox.textContent = 'Please provide valid positive numbers for age, height, and weight.';
+            return;
+        }
+
+        const tdee = calculateTDEE({ sex, age, height, weight, activity });
+        const tdeeResult = document.getElementById('tdee-result');
+        tdeeResult.innerHTML = `<p>Your estimated TDEE is <strong>${Math.round(tdee)} kcal/day.</strong></p>`;
+        showPremiumOffer(tdee, 'tdee-upsell');
+    });
+
+    // Food database
+    const foodDatabase = {
+        'chicken breast': { calories: 165, protein: 31, carbs: 0, fats: 4, serving: 'per 100g cooked' },
+        'rice': { calories: 130, protein: 2.7, carbs: 28, fats: 0.3, serving: 'per 100g cooked' },
+        'egg': { calories: 78, protein: 6, carbs: 0.6, fats: 5, serving: 'per large egg' },
+        'greek yogurt 0%': { calories: 59, protein: 10, carbs: 3.6, fats: 0.4, serving: 'per 100g' },
+        'olive oil': { calories: 88, protein: 0, carbs: 0, fats: 10, serving: 'per 10g' }
+    };
+
+    document.getElementById('food-search').addEventListener('click', () => {
+        const query = document.getElementById('food-input').value.trim().toLowerCase();
+        const resultBox = document.getElementById('food-result');
+        if (!query) {
+            resultBox.textContent = 'Please enter a food to search.';
+            return;
+        }
+        if (foodDatabase[query]) {
+            const { calories, protein, carbs, fats, serving } = foodDatabase[query];
+            resultBox.innerHTML = `
+                <h4>${capitalize(query)}</h4>
+                <p>${serving}</p>
+                <p>${calories} kcal • Protein: ${protein} g • Carbs: ${carbs} g • Fats: ${fats} g</p>
+            `;
+        } else {
+            resultBox.textContent = 'Food not in database.';
+        }
+    });
+
+    // Cooked to raw converter
+    const conversionFactors = {
+        chicken: 0.75,
+        rice: 0.33,
+        pasta: 0.4
+    };
+
+    document.getElementById('converter-form').addEventListener('submit', (e) => {
+        e.preventDefault();
+        const type = document.getElementById('food-type').value;
+        const cookedWeight = Number(document.getElementById('cooked-weight').value);
+        const resultBox = document.getElementById('converter-result');
+        if (!cookedWeight || cookedWeight <= 0) {
+            resultBox.textContent = 'Please provide a valid cooked weight.';
+            return;
+        }
+        const factor = conversionFactors[type];
+        const rawWeight = cookedWeight * factor;
+        resultBox.textContent = `Approximate raw weight: ${Math.round(rawWeight)} g`;
+    });
+
+    // Progress tracker
+    const progressForm = document.getElementById('progress-form');
+    const progressTableBody = document.querySelector('#progress-table tbody');
+
+    function loadProgress() {
+        const entries = JSON.parse(localStorage.getItem('fit-progress') || '[]');
+        progressTableBody.innerHTML = entries.map(entry => `
+            <tr>
+                <td>${entry.date}</td>
+                <td>${entry.weight}</td>
+                <td>${entry.notes || ''}</td>
+            </tr>
+        `).join('');
+    }
+
+    loadProgress();
+
+    progressForm.addEventListener('submit', (e) => {
+        e.preventDefault();
+        const date = document.getElementById('progress-date').value;
+        const weight = Number(document.getElementById('progress-weight').value);
+        const notes = document.getElementById('progress-notes').value;
+        if (!date || !weight || weight <= 0) return;
+        const entries = JSON.parse(localStorage.getItem('fit-progress') || '[]');
+        entries.unshift({ date, weight, notes });
+        localStorage.setItem('fit-progress', JSON.stringify(entries));
+        progressForm.reset();
+        loadProgress();
+    });
+
+    document.getElementById('clear-progress').addEventListener('click', () => {
+        localStorage.removeItem('fit-progress');
+        loadProgress();
+    });
+
+    // Premium guides placeholder
+    document.querySelectorAll('.guide-btn').forEach(btn => {
+        btn.addEventListener('click', () => alert('Coming soon – premium content.'));
+    });
+
+    // Modal logic
+    closeModalBtn.addEventListener('click', closeModal);
+    modal.addEventListener('click', (e) => {
+        if (e.target === modal) closeModal();
+    });
+
+    function openPaywall(calories) {
+        pendingCalories = calories;
+        modalBody.innerHTML = `
+            <h4>Get Your Personalized Daily Meal Plan</h4>
+            <p>For only €2.99/month, unlock AI-powered meal plans based on your exact calories, macros, and goals.</p>
+            <ul>
+                <li>Daily logs & accountability</li>
+                <li>Custom recipes & grocery lists</li>
+                <li>24/7 AI coaching support</li>
+            </ul>
+            <button id="confirm-payment" class="primary" style="margin-top:1rem; width:100%">Confirm Payment</button>
+        `;
+        modal.classList.add('show');
+        modal.setAttribute('aria-hidden', 'false');
+        document.getElementById('confirm-payment').addEventListener('click', () => {
+            generateMealPlan(pendingCalories || 2000);
+        }, { once: true });
+    }
+
+    function closeModal() {
+        modal.classList.remove('show');
+        modal.setAttribute('aria-hidden', 'true');
+    }
+
+    function generateMealPlan(calories) {
+        const mealRatios = [
+            { name: 'Breakfast', ratio: 0.25 },
+            { name: 'Lunch', ratio: 0.3 },
+            { name: 'Dinner', ratio: 0.3 },
+            { name: 'Snack', ratio: 0.15 }
+        ];
+        const macros = { protein: 0.35, carbs: 0.4, fats: 0.25 };
+        const mealHtml = mealRatios.map(meal => {
+            const mealCalories = calories * meal.ratio;
+            const protein = Math.round((mealCalories * macros.protein) / 4);
+            const carbs = Math.round((mealCalories * macros.carbs) / 4);
+            const fats = Math.round((mealCalories * macros.fats) / 9);
+            return `
+                <div class="meal-card">
+                    <h5>${meal.name} • ${Math.round(mealCalories)} kcal</h5>
+                    <p>Protein: ${protein} g</p>
+                    <p>Carbs: ${carbs} g</p>
+                    <p>Fats: ${fats} g</p>
+                </div>
+            `;
+        }).join('');
+
+        modalBody.innerHTML = `
+            <h4>Your Personalized Meal Plan (${Math.round(calories)} kcal)</h4>
+            <p>High-protein meals tailored to your latest calculation.</p>
+            <div class="meal-plan">${mealHtml}</div>
+            <button class="save-plan">Save This Plan (Premium Feature)</button>
+        `;
+        modalBody.querySelector('.save-plan').addEventListener('click', () => {
+            alert('Feature available to subscribers.');
+        });
+    }
+
+    function showPremiumOffer(calories, containerId) {
+        pendingCalories = calories;
+        const container = document.getElementById(containerId);
+        container.innerHTML = `
+            <div class="upsell-box">
+                <h4>Get Your Personalized Daily Meal Plan</h4>
+                <p>For only €2.99/month, unlock AI-powered meal plans based on your exact calories, macros, and goals.<br>Daily logs, custom recipes, grocery lists, and 24/7 AI coaching included.</p>
+                <button class="primary upsell-btn">Unlock Meal Plans (€2.99/month)</button>
+            </div>
+        `;
+        container.querySelector('.upsell-btn').addEventListener('click', () => openPaywall(calories));
+    }
+
+    function calculateTDEE({ sex, age, height, weight, activity }) {
+        const bmr = sex === 'male'
+            ? 10 * weight + 6.25 * height - 5 * age + 5
+            : 10 * weight + 6.25 * height - 5 * age - 161;
+        return bmr * activity;
+    }
+
+    function adjustCaloriesForGoal(calories, goal) {
+        const adjustments = { cut: 0.85, maintain: 1, bulk: 1.15 };
+        return calories * (adjustments[goal] || 1);
+    }
+
+    function calculateMacros(weightKg, calories) {
+        const proteinGrams = Math.round(weightKg * 2);
+        const fatsGrams = Math.round(weightKg * 0.8);
+        const caloriesFromProtein = proteinGrams * 4;
+        const caloriesFromFats = fatsGrams * 9;
+        const remainingCalories = Math.max(calories - caloriesFromProtein - caloriesFromFats, calories * 0.2);
+        const carbsGrams = Math.round(remainingCalories / 4);
+        return {
+            protein: proteinGrams,
+            carbs: carbsGrams,
+            fats: fatsGrams
+        };
+    }
+
+    function capitalize(text) {
+        return text.replace(/\b\w/g, c => c.toUpperCase());
+    }
+});
