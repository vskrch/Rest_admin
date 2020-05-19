function writeMessageToPilotipConsole(message) {
    var now = new Date().toLocaleTimeString();
    var msg = now + " - " + message + "\n";
    console.log(msg);
    var inputVal = document.getElementById("Pilotip_Satellite_Messages");
    inputVal.value = msg + inputVal.value;
}
function start_something() {
    var message = "This is a long text but... I wish to starting something: " + mqtt.clientId;
    writeMessageToPilotipConsole(message);
}
function stop_something() {
    writeMessageToPilotipConsole("I wish to stop something " + mqtt);
}
function startSatelliteTasks() {
    var message = new Paho.MQTT.Message("start");
    message.destinationName = "pilotip/tasks/satellite/command";
    mqtt.send(message);
    writeMessageToPilotipConsole("Starting Satellite Tasks Routines...");
}
function stopSatelliteTasks() {
    var message = new Paho.MQTT.Message("stop");
    message.destinationName = "pilotip/tasks/satellite/command";
    mqtt.send(message);
    writeMessageToPilotipConsole("Stopping Satellite Tasks Routines...");
}
function getPilotipStatus(message) {
    var inputVal = document.getElementById("Pilotip_Healthy");
    if (message === "1") {
        var now = new Date().toLocaleTimeString();
        inputVal.style.backgroundColor = "green";
        inputVal.value = "Healthy: " + now;
    }
    else {
        inputVal.style.backgroundColor = "red";
        inputVal.value = "Failed";
    }
}
function getSatelliteStatus(message) {
    var inputVal = document.getElementById("Pilotip_Satellite");
    if (message === "1") {
        inputVal.style.backgroundColor = "green";
        inputVal.value = "Healthy";
    }
    else {
        inputVal.style.backgroundColor = "red";
        inputVal.value = "Failed";
    }
}
function getSatelliteTasksStatus(message) {
    var inputVal = document.getElementById("Pilotip_Satellite_Tasks_Status");
    if (message === "1") {
        inputVal.style.backgroundColor = "green";
        inputVal.value = "Started";
    }
    else {
        inputVal.style.backgroundColor = "red";
        inputVal.value = "Stopped";
    }
}
function getSatelliteTasksLapses(message) {
    var message_splitted = message.split(";");
    if (message_splitted.length === 2) {
        document.getElementById("Pilotip_Satellite_Tasks_Lapse").value = message_splitted[0];
        document.getElementById("Pilotip_Satellite_Tasks_Countdown").value = message_splitted[1];
    }
    else {
        document.getElementById("Pilotip_Satellite_Tasks_Lapse").value = "Undefined";
        document.getElementById("Pilotip_Satellite_Tasks_Countdown").value = "Undefined";
    }
}
function setSatelliteTasksLapses() {
    var lapse = document.getElementById("Pilotip_Satellite_Tasks_Lapse").value;
    var value_lapse = parseInt(lapse, 10);
    if (isNaN(value_lapse) || (value_lapse <= 0)) {
        writeMessageToPilotipConsole("Wrong value of lapse");
        return;
    }
    var countdown = document.getElementById("Pilotip_Satellite_Tasks_Countdown").value;
    var value_countdown = parseInt(countdown, 10);
    if (isNaN(value_countdown) || (value_countdown <= 0)) {
        writeMessageToPilotipConsole("Wrong value of countdown");
        return;
    }
    if (value_lapse >= value_countdown) {
        writeMessageToPilotipConsole("Lapse must be less of Countdown");
        return;
    }
    var command = "setlapse " + value_lapse + ";" + value_countdown;
    var mqtt_message = new Paho.MQTT.Message(command);
    mqtt_message.destinationName = "pilotip/tasks/satellite/command";
    mqtt.send(mqtt_message);
    writeMessageToPilotipConsole("Sending new Satellite Task Lapses values...");
}
