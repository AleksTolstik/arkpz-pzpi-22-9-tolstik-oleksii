from machine import Pin, I2C, PWM
import ssd1306
import ujson 
import urequests
import network
import time
import utime
import ntptime

# іd контейнеру
container_id = 1

# Прапори для стану пристрою
device_on = False
wifi_connected = False
time_synced = False
taken = False
med_schedule = []
inventory_info = []
patient_id = 0
servo_number = 0
id_inventory = 0

# Ініціалізація OLED-дисплея
i2c = I2C(0, scl=Pin(22), sda=Pin(21))
oled_width = 128
oled_height = 64
oled = ssd1306.SSD1306_I2C(oled_width, oled_height, i2c)

# Ініціалізація сервоприводу, кнопки, лампочки, спікеру і сенсору
servo1 = PWM(Pin(15), freq=50)
servo2 = PWM(Pin(2), freq=50)
servo3 = PWM(Pin(0), freq=50)
servo4 = PWM(Pin(4), freq=50)
servo5 = PWM(Pin(16), freq=50)
servo6 = PWM(Pin(17), freq=50)
button = Pin(18, Pin.IN, Pin.PULL_UP)
led = Pin(19, Pin.OUT)
buzzer = PWM(Pin(12)) 
buzzer.duty_u16(0)
sensor = Pin(13, Pin.IN)

# Функція підключення до Wi-Fi
def wifi_connect():
    global wifi_connected
    sta_if = network.WLAN(network.STA_IF)
    if not sta_if.isconnected():
        display_message("Connecting to WiFi")
        sta_if.active(True)
        sta_if.connect('Wokwi-GUEST', '')
        timeout = 15
        while not sta_if.isconnected() and timeout > 0:
            display_message(f"Connecting... {20 - timeout}s")
            time.sleep(1)
            timeout -= 1
    if sta_if.isconnected():
        display_message("WiFi Connected!")
        wifi_connected = True
    else:
        display_message("WiFi Failed")

# Функція базера
def buzz_on(frequency=1000, duration=1, repeats=3):
    for _ in range(repeats):
        buzzer.freq(frequency)
        buzzer.duty_u16(32768)   # Встановлюємо середню гучність (32768 = 50% від 65535)
        time.sleep(duration)
        buzzer.duty_u16(0)
        time.sleep(0.5)    

# Функція для керування сервоприводом
def move_servo(servo_number, angle):
    duty = int((angle / 180) * 102 + 26)
    if servo_number == 1:
        servo1.duty(duty)
    elif servo_number == 2:
        servo2.duty(duty)
    elif servo_number == 3:
        servo3.duty(duty)
    elif servo_number == 4:
        servo4.duty(duty)
    elif servo_number == 5:
        servo5.duty(duty)
    elif servo_number == 6:
        servo6.duty(duty)
    else:
        print(f"Error: Invalid servo_number {servo_number}.")

# Функція для виводу тексту на дисплей
def display_message(message1, message2="", x1=0, y1=0, x2=0, y2=10):
    oled.fill(0)
    oled.text(message1, x1, y1)
    if message2:
        oled.text(message2, x2, y2)
    oled.show()

# Функція синхронізації часу
def sync_time():
    global time_synced
    try:
        display_message("Syncing time...")
        ntptime.settime()
        time_synced = True
        display_message("Time synced!")
    except Exception as e:
        display_message("Time sync failed!")

# Функція для оновлення екрану з часом
def update_display():
    if med_schedule and len(med_schedule) >= 3:
        medication = med_schedule[1]
        time_left = calculate_remaining_time(med_schedule[2])

        if medication and time_left != "0h 0m":
            display_message(f"Next: {medication}", f"In: {time_left}")
        elif medication and time_left == "0h 0m":
            display_message(f"Take {medication}", "Now!")
        else:
            display_message("No meds", "for today")
    else:
        display_message("No medications", "for today!")

# Підрахунок часу що залишився
def calculate_remaining_time(target_time_str, timezone_offset=2):
    current_time = time.localtime()
    current_hours = current_time[3] 
    current_minutes = current_time[4]
    current_hours = (current_hours + timezone_offset) % 24
    target_hours, target_minutes = map(int, target_time_str.split(":"))

    remaining_hours = target_hours - current_hours
    remaining_minutes = target_minutes - current_minutes

    if remaining_minutes < 0:
        remaining_hours -= 1
        remaining_minutes += 60

    if remaining_hours < 0:
        remaining_hours += 24

    return f"{remaining_hours}h {remaining_minutes}m"

""" Зв язок з Back-end частиною """
# оновлення статусу контейнера
def send_status_update(operational_status, network_status, container_id):
    url = f"https://healthy-helper-deploy-4e7d81694293.herokuapp.com/container/{container_id}/updateStatus"
    payload = {
        "operational_status": operational_status,
        "network_status": network_status
    }
    headers = {"Content-Type": "application/json"}
    try:
        print("Update container status...")
        response = urequests.post(url, json=payload, headers=headers)
        response.close()
    except Exception as e:
        print("Failed to send status update:", e)

# отримання пацієнта за контейнером
def fetch_patient_id(container_id):
    url = f"https://healthy-helper-deploy-4e7d81694293.herokuapp.com/container/{container_id}/getPatientId"
    try:
        print("Fetching patient ID...")
        response = urequests.get(url)
        response_data = ujson.loads(response.content.decode('utf-8'))
        response.close()
        
        if "id_patient" in response_data:
            return response_data["id_patient"]
        else:
            display_message("No patient found for this container")
            print("No patient found for this container")
            return None
    except Exception as e:
        print("Failed to fetch patient ID:", e)
        return None

# отримання наступного препарату
def fetch_next_medication(patient_id):
    global med_schedule
    url = f"https://healthy-helper-deploy-4e7d81694293.herokuapp.com/container/nearestIntake/{patient_id}"
    try:
        print("Fetching next medication...")
        response = urequests.get(url)
        response_data = ujson.loads(response.content.decode('utf-8'))
        response.close()

        intake_time_raw = response_data.get("intake_time", "")
        intake_time_formatted = intake_time_raw.split("T")[1][:5]

        med_schedule = [
            response_data.get("id_intake_schedule"),
            response_data.get("medication_name"),
            intake_time_formatted
        ]

        print("Medication Schedule:", med_schedule)
    except Exception as e:
        print("No medication for today.")
        med_schedule = []

# оновлення статусу прийняття ліків
def send_intakeStatus_update(intake_id):
    url = f"https://healthy-helper-deploy-4e7d81694293.herokuapp.com/container/updateMedicationIntakeStatus/{intake_id}"
    payload = {
        "status": 1
    }
    headers = {"Content-Type": "application/json"}
    try:
        print("Update intake status...")
        response = urequests.post(url, json=payload, headers=headers)
        response.close()
    except Exception as e:
        print("Failed to send status update:", e)

# відправити повідомлення про пропуск дози
def send_notification():
    global med_schedule
    global container_id
    medication_id = 0
    medication_name = med_schedule[1]

    url = "https://healthy-helper-deploy-4e7d81694293.herokuapp.com/container/medicationId"
    payload = {
        "medication_name": medication_name
    }
    headers = {"Content-Type": "application/json"}
    try:
        response = urequests.post(url, json=payload, headers=headers)
        if response.status_code == 200:
            response_data = ujson.loads(response.content.decode('utf-8'))
            medication_id = response_data.get("id_medication", 0)
        else:
            print(f"Failed to get medication ID. Status: {response.status_code}")
        response.close()
    except Exception as e:
        print("Failed to fetch medication ID:", e)

    url = "https://healthy-helper-deploy-4e7d81694293.herokuapp.com/notification/missed-doseate"
    payload = {
        "containerId": container_id,
        "medicationId": medication_id
    }
    headers = {"Content-Type": "application/json"}
    try:
        print("Sending missed dose notification...")
        response = urequests.post(url, json=payload, headers=headers)
        if response.status_code in [200, 201]:
            print("Notification sent successfully!")
            print(f"Response: {response.text}")
        else:
            print(f"Failed to send notification. Status: {response.status_code}")
            print(f"Response: {response.text}")
        response.close()
    except Exception as e:
        print("Failed to send notification:", e)

# перевірити ліки у відсіках
def check_inventory():
    global inventory_info
    global container_id
    medication_id = 0
    medication_name = med_schedule[1]

    url = "https://healthy-helper-deploy-4e7d81694293.herokuapp.com/container/medicationId"
    payload = {
        "medication_name": medication_name
    }
    headers = {"Content-Type": "application/json"}

    try:
        response = urequests.post(url, json=payload, headers=headers)
        if response.status_code == 200:
            response_data = ujson.loads(response.content.decode('utf-8'))
            medication_id = response_data.get("id_medication", 0)
        else:
            print(f"Failed to get medication ID. Status: {response.status_code}")
            return
        response.close()
    except Exception as e:
        print("Failed to fetch medication ID:", e)
        return

    # Отримуємо інформацію про відсік
    url = f"https://healthy-helper-deploy-4e7d81694293.herokuapp.com/container/inventoryByMedicationAndContainer/{medication_id}/{container_id}"
    try:
        print("Fetching inventory information...")
        response = urequests.get(url)
        if response.status_code == 200:
            response_data = ujson.loads(response.content.decode('utf-8'))
            response.close()

            id_inventory = response_data.get("id_inventory", "")
            quantity = response_data.get("quantity", "")
            inventory_number = response_data.get("inventory_number", "")

            inventory_info = [
                id_inventory,
                quantity,
                inventory_number
            ]

            if quantity < 4:
                print(f"Low stock alert: Only {quantity} tablet(s) left for {medication_name}. Sending notification...")
                display_message("Low stock alert!")
                notify_low_stock(container_id, medication_id)

            print("Inventory information:", inventory_info)
        else:
            print(f"Failed to fetch inventory information. Status: {response.status_code}")
            inventory_info = []
            response.close()
    except Exception as e:
        print("Failed to fetch inventory information:", e)
        inventory_info = []

# оновлення кількості ліків
def update_medquantity():
    global inventory_info
    url = f"https://healthy-helper-deploy-4e7d81694293.herokuapp.com/container/decrementQuantity/{inventory_info[0]}"
    headers = {"Content-Type": "application/json"}
    try:
        print("Update medication quantity...")
        response = urequests.post(url, headers=headers)
        if response.status_code == 200:
            response_data = ujson.loads(response.content.decode('utf-8'))
            print("Quantity updated successfully:", response_data)
        else:
            print(f"Failed to update quantity. Status code: {response.status_code}, Response: {response.text}")
        
        response.close()
    except Exception as e:
        print("Failed to update medication quantity:", e)

# відправлення сповіщення малий залишок ліків
def notify_low_stock(container_id, medication_id):
    url = "https://healthy-helper-deploy-4e7d81694293.herokuapp.com/notification/low-stock"
    payload = {
        "containerId": container_id,
        "medicationId": medication_id
    }
    headers = {"Content-Type": "application/json"}
    try:
        response = urequests.post(url, json=payload, headers=headers)
        if response.status_code == 201:
            print("Low stock notification sent successfully.")
        else:
            print(f"Failed to send low stock notification. Status: {response.status_code}")
        response.close()
    except Exception as e:
        print("Error sending low stock notification:", e)

# Основний цикл
while True:
    if button.value() == 0:
        if not device_on:  # Якщо пристрій вимкнено
            device_on = True
            led.value(1)
            display_message("Device ON...")
            time.sleep(2)
            wifi_connect()
            if wifi_connected:
                sync_time()
                send_status_update(1, 1, container_id)
                patient_id = fetch_patient_id(container_id)
                if patient_id:
                    fetch_next_medication(patient_id)
                    if med_schedule:
                        check_inventory()
                        if inventory_info:                           
                            display_message("Schedule loaded", f"Patient: {patient_id}")
                            time.sleep(2) 
                        else:
                            display_message("No inventory")
                            time.sleep(2)
                    else:
                        display_message("No medications", "for today!")
                        time.sleep(2)
                else:
                    display_message("No patient", "found")
            else:
                display_message("No WiFi")
        else:  # Якщо пристрій увімкнено
            device_on = False
            led.value(0)
            send_status_update(0, 0, container_id)
            display_message("Device OFF")
            time.sleep(2)
            display_message("")

    if device_on and wifi_connected and time_synced and med_schedule:
        time_left = calculate_remaining_time(med_schedule[2])
        medication = med_schedule[1]

        if time_left == "0h 0m":
            display_message(f"Take {medication}", "Now!")
            buzz_on(repeats=3)
            move_servo(inventory_info[2], 0)

            start_time = time.time()
            while sensor.value() == 0:
                display_message(f"Take {medication}", "Waiting...")
                time.sleep(0.1)

                # Якщо минуло більше 5 хвилин
                if time.time() - start_time > 300:
                    print("5 minutes passed. Sending missed dose notification.")
                    move_servo(inventory_info[2], 90)
                    send_notification()
                    fetch_next_medication(patient_id)
                    if med_schedule:
                        check_inventory()
                    break

            # Перевіряємо, чи ліки справді взяті
            if sensor.value() == 1:
                display_message(f"{medication} taken!", "Thank you!")
                move_servo(inventory_info[2], 90)
                # Перевіряємо кількість ліків
                if inventory_info[1] > 0:
                    send_intakeStatus_update(med_schedule[0])
                    update_medquantity()
                else:
                    print("Medication finished!")
                    display_message("Medication finished!", "Please refill")

                fetch_next_medication(patient_id)
                if med_schedule:
                    check_inventory()

        update_display()
    else:
        time.sleep(0.1)