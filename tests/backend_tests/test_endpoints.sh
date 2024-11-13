#!/bin/bash

# Configura il path del tuo ambiente virtuale Python
VENV_PATH="~/Scrivania/Turing/Rubrica/rubrica-azure/venv/bin/activate"

# Attiva l'ambiente virtuale
source $VENV_PATH

# Imposta il path della root directory del progetto
PROJECT_ROOT="~/Scrivania/Turing/Rubrica/rubrica-azure"

# Naviga alla directory dei test backend
cd $PROJECT_ROOT/tests/backend_tests

# Crea un file di log per registrare l'output dei test
LOG_FILE="endpoint_tests.log"

# Funzione per eseguire i test e registrare l'output
function run_test() {
    local endpoint="$1"
    local method="$2"
    local data="$3"
    local expected_status="$4"

    echo "[ START ] Testing $method $endpoint" | tee -a $LOG_FILE
    
    if [ "$method" == "POST" ]; then
        response=$(curl -s -X POST -H "Content-Type: application/json" -d "$data" http://localhost:8000/api/v1/$endpoint)
    elif [ "$method" == "GET" ]; then
        response=$(curl -s -X GET http://localhost:8000/api/v1/$endpoint)
    elif [ "$method" == "PUT" ]; then
        response=$(curl -s -X PUT -H "Content-Type: application/json" -d "$data" http://localhost:8000/api/v1/$endpoint)
    elif [ "$method" == "DELETE" ]; then
        response=$(curl -s -X DELETE http://localhost:8000/api/v1/$endpoint)
    fi

    status_code=$(echo $response | jq -r '.status_code')

    if [ "$status_code" == "$expected_status" ]; then
        echo "[ PASS ] $method $endpoint - Status code: $status_code" | tee -a $LOG_FILE
    else
        echo "[ FAIL ] $method $endpoint - Status code: $status_code, Expected: $expected_status" | tee -a $LOG_FILE
        echo "$response" | tee -a $LOG_FILE
    fi

    echo "[ END ] Testing $method $endpoint" | tee -a $LOG_FILE
    echo "" | tee -a $LOG_FILE
}

# Test per gli endpoint di autenticazione
run_test "auth/register" "POST" '{"email":"test@example.com","username":"testuser","password":"Test123!"}' 201
run_test "auth/login" "POST" '{"username":"testuser","password":"Test123!"}' 200
run_test "auth/password-reset" "POST" '{"email":"test@example.com"}' 202
run_test "auth/password" "PUT" '{"current_password":"Test123!","new_password":"NewPassword123!"}' 200
run_test "auth/me" "GET" "" 200

# Test per gli endpoint di gestione contatti
run_test "contacts" "POST" '{"first_name":"John","last_name":"Doe","email":"john@example.com","phone":"1234567890"}' 201
run_test "contacts" "GET" "" 200
run_test "contacts/1" "GET" "" 200
run_test "contacts/1" "PUT" '{"first_name":"Jane","last_name":"Doe","email":"jane@example.com","phone":"0987654321"}' 200
run_test "contacts/1" "DELETE" "" 204
run_test "contacts/search" "POST" '{"query":"John","favorite_only":false}' 200