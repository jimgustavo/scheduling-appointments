package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	_ "github.com/lib/pq"
)

type Appointment struct {
	ID               int       `json:"id"`
	FullName         string    `json:"full_name"`
	Email            string    `json:"email"`
	PhoneNumber      string    `json:"phone_number"`
	VehicleMake      string    `json:"vehicle_make"`
	VehicleModel     string    `json:"vehicle_model"`
	VehicleYear      int       `json:"vehicle_year"`
	ServiceType      string    `json:"service_type"`
	PreferredDate    string    `json:"preferred_date"`
	PreferredTime    string    `json:"preferred_time"`
	AdditionalNotes  string    `json:"additional_notes"`
	CreationDate     time.Time `json:"creation_date"`
	AppointmentState string    `json:"appointment_state"`
}

var db *sql.DB

func init() {
	// Initialize the database connection in an init function
	var err error
	db, err = sql.Open("postgres", "postgres://tavito:mamacita@localhost:5432/appointments?sslmode=disable")
	if err != nil {
		log.Fatal("Failed to connect to the database:", err)
	}

	// Check the database connection
	if err = db.Ping(); err != nil {
		log.Fatal("Failed to ping the database:", err)
	}
}

func main() {
	defer db.Close()

	router := mux.NewRouter()

	// Serve static files from the "static" directory
	router.PathPrefix("/static/").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	router.HandleFunc("/appointments", GetAppointments).Methods("GET")
	router.HandleFunc("/appointments/{id}", GetAppointment).Methods("GET")
	router.HandleFunc("/appointments", CreateAppointment).Methods("POST")
	router.HandleFunc("/appointments/{id}", UpdateAppointment).Methods("PUT")
	router.HandleFunc("/appointments/{id}", DeleteAppointment).Methods("DELETE")

	log.Println("Server running on port 8080...")
	log.Fatal(http.ListenAndServe(":8080", router))
}

func GetAppointments(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	rows, err := db.Query("SELECT * FROM appointments")
	if err != nil {
		http.Error(w, "Failed to retrieve appointments from the database", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var appointments []Appointment

	for rows.Next() {
		var appointment Appointment
		if err := rows.Scan(
			&appointment.ID,
			&appointment.FullName,
			&appointment.Email,
			&appointment.PhoneNumber,
			&appointment.VehicleMake,
			&appointment.VehicleModel,
			&appointment.VehicleYear,
			&appointment.ServiceType,
			&appointment.PreferredDate,
			&appointment.PreferredTime,
			&appointment.AdditionalNotes,
			&appointment.CreationDate,
			&appointment.AppointmentState,
		); err != nil {
			http.Error(w, "Failed to scan appointment data from the database", http.StatusInternalServerError)
			return
		}
		appointments = append(appointments, appointment)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "Error while iterating over database rows", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(appointments)
}

func GetAppointment(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	params := mux.Vars(r)
	appointmentID, err := strconv.Atoi(params["id"])
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	row := db.QueryRow("SELECT * FROM appointments WHERE id = $1", appointmentID)

	var appointment Appointment
	if err := row.Scan(
		&appointment.ID,
		&appointment.FullName,
		&appointment.Email,
		&appointment.PhoneNumber,
		&appointment.VehicleMake,
		&appointment.VehicleModel,
		&appointment.VehicleYear,
		&appointment.ServiceType,
		&appointment.PreferredDate,
		&appointment.PreferredTime,
		&appointment.AdditionalNotes,
		&appointment.CreationDate,
		&appointment.AppointmentState,
	); err != nil {
		if err == sql.ErrNoRows {
			http.NotFound(w, r)
		} else {
			http.Error(w, "Failed to retrieve appointment from the database", http.StatusInternalServerError)
		}
		return
	}

	json.NewEncoder(w).Encode(appointment)
}

func CreateAppointment(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var newAppointment Appointment
	if err := json.NewDecoder(r.Body).Decode(&newAppointment); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Insert the new appointment data into the database
	_, err := db.Exec(
		"INSERT INTO appointments (full_name, email, phone_number, vehicle_make, vehicle_model, vehicle_year, service_type, preferred_date, preferred_time, additional_notes, appointment_state) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
		newAppointment.FullName, newAppointment.Email, newAppointment.PhoneNumber, newAppointment.VehicleMake, newAppointment.VehicleModel,
		newAppointment.VehicleYear, newAppointment.ServiceType, newAppointment.PreferredDate, newAppointment.PreferredTime, newAppointment.AdditionalNotes,
		newAppointment.AppointmentState,
	)
	if err != nil {
		http.Error(w, "Failed to insert data into the database", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(newAppointment)
}

func UpdateAppointment(w http.ResponseWriter, r *http.Request) {
	// Add logging statement to print the start of the handler execution
	log.Println("UpdateAppointment handler started")

	w.Header().Set("Content-Type", "application/json")
	params := mux.Vars(r)
	appointmentID, err := strconv.Atoi(params["id"])
	if err != nil {
		// Add logging statement to print the error
		log.Println("Invalid appointment ID:", err)
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	// Add logging statement to print the extracted appointment ID
	log.Println("Appointment ID:", appointmentID)

	var updatedAppointment Appointment
	if err := json.NewDecoder(r.Body).Decode(&updatedAppointment); err != nil {
		// Add logging statement to print the decoding error
		log.Println("Failed to decode JSON:", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Add logging statement to print the decoded appointment data
	log.Println("Updated appointment data:", updatedAppointment)

	// Execute database update operation
	_, err = db.Exec(
		"UPDATE appointments SET full_name = $2, email = $3, phone_number = $4, vehicle_make = $5, vehicle_model = $6, vehicle_year = $7, service_type = $8, preferred_date = $9, preferred_time = $10, additional_notes = $11, appointment_state = $12 WHERE id = $1",
		appointmentID,
		updatedAppointment.FullName,
		updatedAppointment.Email,
		updatedAppointment.PhoneNumber,
		updatedAppointment.VehicleMake,
		updatedAppointment.VehicleModel,
		updatedAppointment.VehicleYear,
		updatedAppointment.ServiceType,
		updatedAppointment.PreferredDate,
		updatedAppointment.PreferredTime,
		updatedAppointment.AdditionalNotes,
		updatedAppointment.AppointmentState,
	)
	if err != nil {
		// Add logging statement to print the database update error
		log.Println("Failed to update appointment in the database:", err)
		http.Error(w, "Failed to update appointment in the database", http.StatusInternalServerError)
		return
	}

	// Add logging statement to indicate successful database update
	log.Println("Appointment updated successfully")

	updatedAppointment.ID = appointmentID

	// Encode and send response
	json.NewEncoder(w).Encode(updatedAppointment)

	// Add logging statement to print the end of the handler execution
	log.Println("UpdateAppointment handler completed")
}

func DeleteAppointment(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	params := mux.Vars(r)
	appointmentID, err := strconv.Atoi(params["id"])
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	_, err = db.Exec("DELETE FROM appointments WHERE id = $1", appointmentID)
	if err != nil {
		http.Error(w, "Failed to delete appointment from the database", http.StatusInternalServerError)
		return
	}

	successMessage := map[string]string{"message": "Appointment deleted successfully"}
	json.NewEncoder(w).Encode(successMessage)
}

/*
///////Postgres Database//////////
psql

\l

CREATE DATABASE appointments;

DROP DATABASE appointments;     //for deleting a database


\c appointments

pwd

\i /Users/tavito/Documents/go/scheduling-appointments-automotive-services/appointments.sql

\dt

//////////////////////CURL COMMANDS///////////////////////
curl -X POST -H "Content-Type: application/json" -d '{
    "full_name": "John Doe",
    "email": "john.doe@example.com",
    "phone_number": "123-456-7890",
    "vehicle_make": "Toyota",
    "vehicle_model": "Camry",
    "vehicle_year": 2022,
    "service_type": "Oil Change",
    "preferred_date": "2024-02-28",
    "preferred_time": "10:00",
    "additional_notes": "Please check the brakes too"
}' http://localhost:8080/appointments

curl -X GET http://localhost:8080/appointments

curl -X GET http://localhost:8080/appointments/{id}

curl -X PUT -H "Content-Type: application/json" -d '{
    "full_name": "Enrique Ruiz",
    "email": "enriqueruiz@gmail.com",
    "phone_number": "987-654-3210",
    "vehicle_make": "Honda",
    "vehicle_model": "Accord",
    "vehicle_year": 2020,
    "service_type": "Tire Rotation",
    "preferred_date": "2024-03-18",
    "preferred_time": "09:00",
    "additional_notes": "None",
	"appointment_state": "Reserved"
}' http://localhost:8080/appointments/3


curl -X DELETE http://localhost:8080/appointments/{id}

*/
