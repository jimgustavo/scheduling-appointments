// script.js

// Function to get all the appointments
async function getAppointments() {
    try {
        const response = await fetch('/appointments');
        const data = await response.json();
        // Display appointments in a list
        const appointmentListContainer = document.getElementById('appointments-list');

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
            `;
            appointmentListContainer.appendChild(appointmentItem);
        });
    } catch (error) {
        console.error('Error fetching appointments:', error);
    }
}

let selectedAppointmentData = null; // Variable to store selected appointment data

function gatherAppointmentData(selectedDate, selectedTime) {
    const form = document.getElementById('create-appointment-form');
    const jsonData = {
        full_name: form.elements['full_name'].value,
        email: form.elements['email'].value,
        phone_number: form.elements['phone_number'].value,
        vehicle_make: form.elements['vehicle_make'].value,
        vehicle_model: form.elements['vehicle_model'].value,
        vehicle_year: parseInt(form.elements['vehicle_year'].value),
        service_type: form.elements['service_type'].value,
        preferred_date: selectedDate.toISOString().slice(0, 10),
        preferred_time: selectedTime,
        additional_notes: form.elements['additional_notes'].value,
        appointment_state:"Pending",
    };  
    selectedAppointmentData = jsonData; // Store the selected appointment data
}

// Function to handle the submit event for creating a new appointment
async function createAppointment() {
    try {
        if (!selectedAppointmentData) {
            console.error('No appointment data selected.');
            return;
        }
        console.log(selectedAppointmentData);
        const response = await fetch('/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(selectedAppointmentData)
        });

        if (response.ok) {
            console.log('Appointment created successfully');
            // Update the appointments list
            getAppointments();
        } else {
            console.error('Failed to create appointment');
        }
    } catch (error) {
        console.error('Error creating appointment:', error);
    }
}

document.addEventListener("DOMContentLoaded", function() {
    //const scheduleBody = document.getElementById("schedule-body");
    const weekSelector = document.getElementById("weekSelector");
    let selectedStartDate; // Store the selected start date

    // Generate options for the week selector
    const today = new Date();
    const startOfWeek = getStartOfWeek(today);
    selectedStartDate = startOfWeek; // Initialize selectedStartDate with the start of the current week
    for (let i = 0; i < 4; i++) { // Show options for the next 4 weeks
        const optionStartDate = new Date(startOfWeek.getTime() + (7 * 24 * 60 * 60 * 1000 * i));
        const optionEndDate = new Date(optionStartDate.getTime() + (6 * 24 * 60 * 60 * 1000));
        const option = document.createElement("option");
        option.value = optionStartDate.toISOString().slice(0, 10); // Format: YYYY-MM-DD
        option.textContent = `${formatDate(optionStartDate)} - ${formatDate(optionEndDate)}`;
        weekSelector.appendChild(option);
    }

    weekSelector.addEventListener('change', function(event) {
        const selectedOption = event.target.value;
        console.log("Selected Option:", selectedOption);
        const selectedDate = new Date(selectedOption);
        console.log("Selected Date:", selectedDate);
        let selectedStartDate = new Date(selectedDate); // Clone the selected date to avoid mutation
        selectedStartDate.setDate(selectedStartDate.getDate() - selectedStartDate.getDay()); // Reset to the start of the week
        console.log("Selected Start Date Before Calculation:", selectedStartDate);
        updateSchedule(selectedStartDate); // Update the schedule when the week is changed
    });
     // Simulate selection of the first option on initial load
     weekSelector.value = weekSelector.firstElementChild.value;
     // Trigger change event to update the schedule
     weekSelector.dispatchEvent(new Event('change'));
});

function updateSchedule(selectedStartDate) {
    const scheduleBody = document.getElementById("schedule-body");
    while (scheduleBody.firstChild) {
        scheduleBody.removeChild(scheduleBody.firstChild); // Clear the schedule
    }
    // Get the current date and time
    const now = new Date();
    console.log(`This is the date for now: ${now}`);
    // Create rows for each hour
    for (let hour = 8; hour <= 18; hour++) {
        const row = document.createElement("tr");
        const timeCell = document.createElement("td");
        timeCell.textContent = hour + ":00";
        row.appendChild(timeCell); 

        // Create cells for each day
        for (let day = 0; day < 6; day++) { // Adjusted to show only Monday to Saturday
            const cell = document.createElement("td");
            //const currentDate = new Date(selectedStartDate.getTime() + (day * 24 * 60 * 60 * 1000));
            const currentDate = new Date(selectedStartDate.getTime() + ((day + 1) * 24 * 60 * 60 * 1000)); // Add 1 day to account for the offset
            //console.log(`This is the current date: ${currentDate}`);
            const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hour);
            //console.log(`This is the cell date: ${cellDate}`);
            const formattedDate = formatDate(cellDate);
            //console.log(`This is the formattedDate of the cell: ${formattedDate}`);
            cell.dataset.time = hour + ":00";
            cell.dataset.day = cellDate.toISOString().slice(0, 10);
            
            // Check if the cell represents a time in the past
            if (cellDate < now) {
                cell.textContent = "Not possible";
                cell.classList.add("not-possible");
            } else {
                cell.textContent = formattedDate;
                cell.addEventListener("click", handleCellClick);
            }
            row.appendChild(cell);
        }
        scheduleBody.appendChild(row);
    }
}

function handleCellClick(event) {
    event.preventDefault(); // Prevent default form submission behavior
    const cell = event.target;
    if (cell.classList.contains("reserved")) {
        cell.classList.remove("reserved");
        cell.textContent = formatDate(new Date(cell.dataset.day + " " + cell.dataset.time));
        console.log("Reservation deleted!");
    } else {
        cell.classList.add("reserved");
        cell.textContent = "Reserved";
        console.log(`Reserved on ${formatDate(new Date(cell.dataset.day + " " + cell.dataset.time))}` );
        // Extract date and time from cell dataset
        const selectedDate = new Date(cell.dataset.day);
        const selectedTime = cell.dataset.time;
        // Call createAppointment with selected date and time
        gatherAppointmentData(selectedDate, selectedTime);
        
    }
}

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

function formatDate(date) {
    return date.toLocaleString('es-EC', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' });
}

// Add event listener to the form for submit event
const createAppointmentForm = document.getElementById('create-appointment-form');
createAppointmentForm.addEventListener('submit', createAppointment);

// Fetch and display auto parts when the page loads
window.onload = getAppointments;