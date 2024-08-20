document.getElementById('theme-toggle-btn').addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');

    // Optionally, save the theme preference in local storage
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
});

// On page load, check the user's saved preference
window.onload = function() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
}

document.getElementById('load-fixtures-btn').addEventListener('click', function() {
    const selectedDate = document.getElementById('match-date').value;
    
    // Placeholder for loading fixtures based on the selected date
    // In the future, you can replace this with an API call to fetch fixtures for the selected date

    alert(`Loading fixtures for: ${selectedDate}`);
    // Example of updating the fixtures dynamically:
    // document.getElementById('fixtures-container').innerHTML = dynamicallyLoadedFixtures;
});


document.addEventListener('DOMContentLoaded', function () {
    const expandButtons = document.querySelectorAll('.btn-expand');

    expandButtons.forEach(button => {
        button.addEventListener('click', function () {
            const viewDetails = this.nextElementSibling;
            if (viewDetails.style.display === 'none' || viewDetails.style.display === '') {
                viewDetails.style.display = 'block';
                this.textContent = 'Collapse';
            } else {
                viewDetails.style.display = 'none';
                this.textContent = 'Expand';
            }
        });
    });

    // Handle form submission
    document.getElementById('scouting-form').addEventListener('submit', function (event) {
        event.preventDefault();
        alert('Scouting view created! (In a real app, this would save the view and display it.)');
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const topics = document.querySelectorAll('.topic h3');

    topics.forEach(topic => {
        topic.addEventListener('click', function () {
            const parent = this.parentElement;
            parent.classList.toggle('expanded');
        });
    });
});
