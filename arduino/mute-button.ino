/*
 * Mute/un-mute your Google meet calls with a Arduino connected button!
 * 
 * This is the arduino code for https://github.com/aporcupine/mute-button
 */

const int LED_PIN = 13;
const int BUTTON_PIN = 12;
const int DEBOUNCE_DELAY = 50;

int lastSteadyState = LOW;
int lastFlickerableState = LOW;
int currentState;
unsigned long lastDebounceTime = 0;

void setup() {
  Serial.begin(9600);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  // turn the LED on if we get a "1" off if we get a "0"
  if (Serial.available() > 0) {
    int incomingByte = Serial.read();
    if (incomingByte == 49) {
      digitalWrite(LED_PIN, 1);
    } else if (incomingByte == 48) {
      digitalWrite(LED_PIN, 0);
    }
  }

  // debounced button press to un-mute the meeting
  currentState = digitalRead(BUTTON_PIN);
  if (currentState != lastFlickerableState) {
    lastDebounceTime = millis();
    lastFlickerableState = currentState;
  }
  if ((millis() - lastDebounceTime) > DEBOUNCE_DELAY) {
    if(lastSteadyState == HIGH && currentState == LOW) {
      // rising edge, send the message to un-mute
      Serial.print("1");
    }
    lastSteadyState = currentState;
  }
}
