document.addEventListener('DOMContentLoaded', function () {
    const entriesContainer = document.getElementById('entries');
    const saveButton = document.getElementById('save-button');
    const currentDateElement = document.getElementById('current-date');
    const previousDaysContainer = document.getElementById('previous-days');
    const modal = document.getElementById('modal');
    const modalDate = document.getElementById('modal-date');
    const modalEntries = document.getElementById('modal-entries');
    const closeButtons = document.querySelectorAll('.close-button');

    const promptModal = document.getElementById('prompt-modal');
    const currentLevelSpan = document.getElementById('current-level');
    const addCountSpan = document.getElementById('add-count');
    const confirmAddButton = document.getElementById('confirm-add');
    const cancelAddButton = document.getElementById('cancel-add');

    const didYouKnowCarousel = document.getElementById('did-you-know-carousel');

    // קטעי הידעת
    const didYouKnowFacts = [
        "מחקרו של רוברט אמונס מצא כי הכרת תודה יכולה לשפר את הבריאות הנפשית ולהפחית תחושות דיכאון.",
        "מרטין סליגמן הראה שכתיבת 3 דברים טובים בכל יום מגבירה את האושר הכללי.",
        "מחקר גילה כי הבעת תודה כלפי בן זוג מחזקת את הקשר הרגשי ומגדילה את שביעות הרצון מהזוגיות.",
        "אנשים שמתרגלים הכרת תודה נוטים לדווח על בריאות פיזית טובה יותר ורמות מתח נמוכות יותר.",
        "תרגול של הכרת תודה מגביר את תחושת המשמעות בחיים ומסייע בהתמודדות עם אתגרים."
    ];

    // הגדרת תאריך עברי ויום בשבוע
    const today = new Date();
    const hebrewDate = new Hebcal.HDate(today); // Hebcal מייצר את תאריך עברי
    const hebrewDateString = hebrewDate.renderGematriya() ? hebrewDate.toString('h') : hebrewDate.toString('h'); // תאריך עברי במחרוזת
    const dayName = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const dayOfWeek = dayName[today.getDay()]; // יום בשבוע
    currentDateElement.textContent = `${dayOfWeek}, ${hebrewDateString}`;

    // מפתח התאריך לשימוש ב-LocalStorage
    const dateKey = today.toLocaleDateString('he-IL');

    // רמות ההודיות המקסימליות
    const levels = [
        { max: 5, next: 10, add: 5 },
        { max: 10, next: 26, add: 16 },
        { max: 26, next: null, add: 0 }
    ];

    let currentLevel = 5;

    // יצירת קטע הידעת
    function createDidYouKnowCarousel(facts) {
        didYouKnowCarousel.innerHTML = '';
        facts.forEach((fact) => {
            const factElement = document.createElement('div');
            factElement.className = 'carousel-item';
            factElement.textContent = fact;
            didYouKnowCarousel.appendChild(factElement);
        });
    }

    createDidYouKnowCarousel(didYouKnowFacts);

    // יצירת שדות קלט בהתאם לרמה
    function createInputFields(level) {
        const savedEntries = JSON.parse(localStorage.getItem(dateKey)) || [];
        entriesContainer.innerHTML = '';
        for (let i = 0; i < level; i++) {
            const entryContainer = document.createElement('div');
            entryContainer.className = 'entry-container';

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'entry-input';
            input.placeholder = `הודיה ${i + 1}`;
            input.value = savedEntries[i] ? savedEntries[i].text : '';
            entryContainer.appendChild(input);

            const select = document.createElement('select');
            select.className = 'category-select';
            const categories = ['קטנים', 'גדולים', 'קשים', 'יומיומיים'];
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'בחר קטגוריה';
            defaultOption.disabled = true;
            defaultOption.selected = !savedEntries[i];
            select.appendChild(defaultOption);
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = `דברים ${cat}`;
                if (savedEntries[i] && savedEntries[i].category === cat) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
            entryContainer.appendChild(select);

            entriesContainer.appendChild(entryContainer);
        }
    }

    // שמירת הודיות
    function saveEntries() {
        try {
            const entryContainers = entriesContainer.getElementsByClassName('entry-container');
            const entries = Array.from(entryContainers).map(container => {
                const text = container.querySelector('.entry-input').value.trim();
                const category = container.querySelector('.category-select').value;
                return text && category ? { text, category } : null;
            }).filter(entry => entry !== null);
            localStorage.setItem(dateKey, JSON.stringify(entries));
            loadPreviousDays();
            checkAndPrompt(entries.length);
            alert('ההודיות נשמרו בהצלחה!');
        } catch (error) {
            console.error('שגיאה בשמירת ההודיות:', error);
            alert('אירעה שגיאה בעת שמירת ההודיות. אנא נסה שוב.');
        }
    }

    // טעינת ימים קודמים
    function loadPreviousDays() {
        previousDaysContainer.innerHTML = '';
        const dates = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key !== dateKey) {
                dates.push(key);
            }
        }
        dates.sort((a, b) => new Date(b) - new Date(a));
        dates.forEach(date => {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'day-entry';
            dayDiv.textContent = date;
            dayDiv.addEventListener('click', () => showEntries(date));
            previousDaysContainer.appendChild(dayDiv);
        });
    }

    // הצגת הודיות בחלון מודאל
    function showEntries(date) {
        try {
            const entries = JSON.parse(localStorage.getItem(date));
            if (!entries) throw new Error('אין נתונים עבור התאריך הזה.');
            modalDate.textContent = date;
            modalEntries.innerHTML = '';
            entries.forEach((entry, index) => {
                if (entry) {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>הודיה ${index + 1}:</strong> ${entry.text} <em>(${entry.category})</em>`;
                    modalEntries.appendChild(li);
                }
            });
            modal.style.display = 'flex';
        } catch (error) {
            console.error('שגיאה בטעינת ההודיות:', error);
            alert('אירעה שגיאה בעת טעינת ההודיות. אנא נסה שוב.');
        }
    }

    // בדיקה והצגת הודעות להוספת הודיות
    function checkAndPrompt(currentCount) {
        for (let level of levels) {
            if (currentCount === level.max && level.next) {
                // עדכון התוכן במודאל
                currentLevelSpan.textContent = level.max;
                addCountSpan.textContent = level.add;
                promptModal.style.display = 'flex';
                break;
            }
        }
    }

    // טיפול באירועי המודאל להוספת הודיות
    confirmAddButton.addEventListener('click', () => {
        const level = levels.find(l => l.max === currentLevel);
        if (level && level.next) {
            currentLevel = level.next;
            createInputFields(currentLevel);
        }
        promptModal.style.display = 'none';
    });

    cancelAddButton.addEventListener('click', () => {
        promptModal.style.display = 'none';
    });

    // סגירת מודאלים בלחיצה על כפתורים
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').style.display = 'none';
        });
    });

    // סגירת המודאל בלחיצה מחוץ לתוכן
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
        if (event.target === promptModal) {
            promptModal.style.display = 'none';
        }
    });

    // אתחול האפליקציה
    function initializeApp() {
        const savedEntries = JSON.parse(localStorage.getItem(dateKey)) || [];
        if (savedEntries.length > 10) {
            currentLevel = 26;
        } else if (savedEntries.length > 5) {
            currentLevel = 10;
        } else {
            currentLevel = 5;
        }
        createInputFields(currentLevel);
        loadPreviousDays();
    }

    initializeApp();
    saveButton.addEventListener('click', saveEntries);
});