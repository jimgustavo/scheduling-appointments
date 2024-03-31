// static/manage_appointments.js

// Function to get all the appointments
async function getAppointments() {
    try {
        const response = await fetch('/appointments');
        const data = await response.json();

        // Display appointments in a list
        const appointmentListContainer = document.getElementById('appointments-list');
        appointmentListContainer.innerHTML = ''; // Clear previous content

        data.map(appointment => {
            const appointmentItem = document.createElement('div');
            appointmentItem.classList.add('appointment-item'); // Add a class for styling
            appointmentItem.innerHTML = `
                <p><strong>ID:</strong> ${appointment.id}</p>
                <p><strong>Full Name:</strong> ${appointment.full_name}</p>
                <p><strong>Email:</strong> ${appointment.email}</p>
                <p><strong>Phone Number:</strong> ${appointment.phone_number}</p>
                <p><strong>Vehicle Make:</strong> ${appointment.vehicle_make}</p>
                <p><strong>Vehicle Model:</strong> ${appointment.vehicle_model}</p>
                <p><strong>Vehicle Year:</strong> ${appointment.vehicle_year}</p>
                <p><strong>Service Type:</strong> ${appointment.service_type}</p>
                <p><strong>Preferred Date:</strong> ${appointment.preferred_date}</p>
                <p><strong>Preferred Time:</strong> ${appointment.preferred_time}</p>
                <p><strong>Additional Notes:</strong> ${appointment.additional_notes}</p>
                <p><strong>Creation Date:</strong> ${appointment.creation_date}</p>
                <p><strong>Appointment State:</strong> ${appointment.appointment_state}</p>
                <button class="update-appointment-btn" data-id="${appointment.id}">Update</button>
                <button class="delete-appointment-btn" data-id="${appointment.id}">Delete</button>
            `;
             // Add event listeners for update and delete buttons
                const updateBtn = appointmentItem.querySelector('.update-appointment-btn');
                updateBtn.addEventListener('click', () => { 
                    handleUpdateButtonClick(appointment);
                    scrollToUpdateSection();
                });

                const deleteBtn = appointmentItem.querySelector('.delete-appointment-btn');
                deleteBtn.addEventListener('click', () => handleDeleteButtonClick(appointment.id));
                
                // Check if appointment state is different from "free"
            if (appointment.appointment_state !== 'free') {
                // Split preferred_date and preferred_time to get the date and time parts
                const [datePart, timePart] = appointment.appointment_state.split(' ');
                const scheduleCell = document.querySelector(`[data-day="${datePart}"][data-time="${timePart}"]`);
                if (scheduleCell) {
                    scheduleCell.textContent = appointment.appointment_state;
                }
            }
                appointmentListContainer.appendChild(appointmentItem);
        });
    } catch (error) {
        console.error('Error fetching appointments:', error);
    }
}

document.addEventListener("DOMContentLoaded", function() {
    const weekSelector = document.getElementById("weekSelector");

    // Generate options for the week selector
    const today = new Date();
    const startOfWeek = getStartOfWeek(today); // Get the start of the current week
    const optionsCount = 4; // Number of weeks to display
    let selectedStartDate = startOfWeek;

    for (let i = 0; i < optionsCount; i++) {
        const optionStartDate = new Date(selectedStartDate.getTime() + (7 * 24 * 60 * 60 * 1000 * i));
        const optionEndDate = new Date(optionStartDate.getTime() + (6 * 24 * 60 * 60 * 1000));
        const option = document.createElement("option");
        option.value = optionStartDate.toISOString().slice(0, 10); // Format: YYYY-MM-DD
        option.textContent = `${formatDate(optionStartDate)} - ${formatDate(optionEndDate)}`;
        weekSelector.appendChild(option);
    }

    weekSelector.addEventListener('change', function(event) {
        const selectedOption = event.target.value;
        const selectedDate = new Date(selectedOption);
        let selectedStartDate = new Date(selectedDate); // Clone the selected date to avoid mutation
        selectedStartDate.setDate(selectedStartDate.getDate() - selectedStartDate.getDay()); // Reset to the start of the week
        updateSchedule(selectedStartDate); // Update the schedule when the week is changed
    });

     // Simulate selection of the first option on initial load
     weekSelector.value = weekSelector.firstElementChild.value;
     // Trigger change event to update the schedule
     weekSelector.dispatchEvent(new Event('change'));
     // Fetch and display appointments when the page loads
     getAppointments().then(() => console.log('Appointments fetched successfully'));
});

function getStartOfWeek(date) {
    if (!(date instanceof Date && !isNaN(date))) {
        // If date is not a valid date object, return null or throw an error
        return null;
    }
    const dayOfWeek = date.getDay();
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Adjust if Sunday
    return startOfWeek;
}

// Global variable to store the schedule grid
let scheduleGrid = [];

async function updateSchedule(selectedStartDate) {
    const scheduleBody = document.getElementById("schedule-body");
    while (scheduleBody.firstChild) {
        scheduleBody.removeChild(scheduleBody.firstChild); // Clear the schedule
    }
    // Get the current date and time
    const now = new Date();
    // Create rows for each hour
    for (let hour = 8; hour <= 18; hour++) {
        const row = document.createElement("tr");
        const timeCell = document.createElement("td");
        timeCell.textContent = hour + ":00";
        row.appendChild(timeCell); 

        // Create cells for each day
        const rowCells = [];
        for (let day = 0; day < 6; day++) { // Adjusted to show only Monday to Saturday
            const cell = document.createElement("td");
            //const currentDate = new Date(selectedStartDate.getTime() + (day * 24 * 60 * 60 * 1000));
            const currentDate = new Date(selectedStartDate.getTime() + ((day + 1) * 24 * 60 * 60 * 1000)); // Add 1 day to account for the offset
            const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hour);
            cell.dataset.time = hour + ":00";
            cell.dataset.day = cellDate.toISOString().slice(0, 10);
            
            // Check if the cell represents a time in the past
            if (cellDate < now) {
                cell.textContent = "Not possible";
                cell.classList.add("not-possible");
            } else {
                // Format date to display only month, day (number), and hour (12-hour format with AM/PM)
                const options = { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: false };
                cell.textContent = cellDate.toLocaleString('en-US', options);
            }
            row.appendChild(cell);
            rowCells.push(cell);
        }
        scheduleBody.appendChild(row);
        scheduleGrid.push(rowCells);
    }

    try {
        const response = await fetch('/appointments');
        const appointments = await response.json();

        for (const appointment of appointments) {
            const appointmentDate = new Date(appointment.preferred_date);
            const cell = findCellByDateTime(appointmentDate, appointment.preferred_time);
            if (cell) {
                cell.textContent = appointment.appointment_state;
            } else {
                console.log(`Cell not found for appointment: ${appointment.id}`);
            }
        }
    } catch (error) {
        console.error('Error fetching appointments:', error);
    }
}

function findCellByDateTime(dateStr, timeStr) {
    // Combine date and time into a single string
    const formattedDate = formatDate2(dateStr);
    const formattedTime = formatTime(timeStr);
    const dateTimeStr = formattedDate + ', ' + formattedTime;
    // Iterate through scheduleGrid to find a matching cell
    for (const rowCells of scheduleGrid) {
        for (const cell of rowCells) {
            // Get the text content of the cell
            const cellDateTimeStr = cell.textContent.trim();
            // Check if the cell text matches the formatted date and time
            if (cellDateTimeStr === dateTimeStr) {
                return cell;
            }
        }
    }
    return null;
}

function formatDate(date) {
    return date.toLocaleString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDate2(inputDate) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateObj = new Date(inputDate);
    const month = months[dateObj.getMonth()];
    const day = dateObj.getDate();

    return month + ' ' + day;
}

function formatTime(inputTime) {
    const dateObj = new Date(inputTime);
    const hours = String(dateObj.getUTCHours()).padStart(2, '0');
    const minutes = String(dateObj.getUTCMinutes()).padStart(2, '0');

    return hours + ':' + minutes;
}

function scrollToUpdateSection() {
    // Scroll to the update section
    document.getElementById('update-form').scrollIntoView({ behavior: 'smooth' });
}

async function updateAppointment(appointmentId, updatedAppointmentData) {
    try {
        const response = await fetch(`/appointments/${appointmentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedAppointmentData)
        });
        if (!response.ok) {
            throw new Error('Failed to update appointment');
        }
        // Refresh appointments after updating
        getAppointments();
        console.log('Appointment updated successfully');
    } catch (error) {
        console.error('Error updating appointment:', error);
    }
}

// Function to handle update button click
function handleUpdateButtonClick(appointment) {
    // Get the form element
    const updateForm = document.getElementById('update-form');

    // Populate the form with appointment data
    document.getElementById('update-appointment-id').value = appointment.id;
    document.getElementById('update-full-name').value = appointment.full_name;
    document.getElementById('update-email').value = appointment.email;
    document.getElementById('update-phone-number').value = appointment.phone_number;
    document.getElementById('update-vehicle-make').value = appointment.vehicle_make;
    document.getElementById('update-vehicle-model').value = appointment.vehicle_model;
    document.getElementById('update-vehicle-year').value = parseInt(appointment.vehicle_year); // Convert to integer
    document.getElementById('update-service-type').value = appointment.service_type;
    document.getElementById('update-preferred-date').value = appointment.preferred_date;
    document.getElementById('update-preferred-time').value = appointment.preferred_time;
    document.getElementById('update-additional-notes').value = appointment.additional_notes;
    document.getElementById('update-appointment-state').value = appointment.appointment_state;

    // Show the form
    updateForm.style.display = 'block';

    // Add event listener for form submission
    updateForm.addEventListener('submit', event => {
        event.preventDefault(); // Prevent default form submission

        // Collect updated appointment data
        const updatedAppointmentData = {
            full_name: document.getElementById('update-full-name').value,
            email: document.getElementById('update-email').value,
            phone_number: document.getElementById('update-phone-number').value,
            vehicle_make: document.getElementById('update-vehicle-make').value,
            vehicle_model: document.getElementById('update-vehicle-model').value,
            vehicle_year: parseInt(document.getElementById('update-vehicle-year').value), // Convert to integer
            service_type: document.getElementById('update-service-type').value,
            preferred_date: document.getElementById('update-preferred-date').value,
            preferred_time: document.getElementById('update-preferred-time').value,
            additional_notes: document.getElementById('update-additional-notes').value,
            appointment_state: document.getElementById('update-appointment-state').value
        };

        // Call updateAppointment function with appointment ID and updated data
        updateAppointment(appointment.id, updatedAppointmentData);

        // Hide the form after submission
        updateForm.style.display = 'none';
    });
}

// Fetch and display auto parts when the page loads
window.onload = getAppointments;