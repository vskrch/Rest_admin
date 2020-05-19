declare var mqtt: any;
declare var Paho: any;

function writeMessageToPilotipConsole(message:string):void {
    const now:string = new Date().toLocaleTimeString();
    let msg:string =  now + " - " + message + "\n";
    console.log(msg);
    var inputVal:HTMLInputElement  = <HTMLInputElement>document.getElementById("Pilotip_Satellite_Messages");
    inputVal.value = msg + inputVal.value;
}

function start_something():void {
    let message:string =  "This is a long text but... I wish to starting something: " + mqtt.clientId;
    writeMessageToPilotipConsole(message);
}

function stop_something():void {
    writeMessageToPilotipConsole("I wish to stop something " + mqtt);
}

function startSatelliteTasks():void {
    let message:any = new Paho.MQTT.Message("start");
    message.destinationName = "pilotip/tasks/satellite/command";
    mqtt.send(message);
    writeMessageToPilotipConsole("Starting Satellite Tasks Routines...");
}

function stopSatelliteTasks():void {
    let message:any = new Paho.MQTT.Message("stop");
    message.destinationName = "pilotip/tasks/satellite/command";
    mqtt.send(message);
    writeMessageToPilotipConsole("Stopping Satellite Tasks Routines...");
}

function getPilotipStatus(message:string):void {
    let inputVal:HTMLInputElement = <HTMLInputElement>document.getElementById("Pilotip_Healthy");
    if (message === "1") {
        const now:string = new Date().toLocaleTimeString();
        inputVal.style.backgroundColor = "green";
        inputVal.value = "Healthy: " + now;
    } else {
        inputVal.style.backgroundColor = "red";
        inputVal.value = "Failed";
    }
}

function getSatelliteStatus(message:string):void {
    let inputVal:HTMLInputElement = <HTMLInputElement>document.getElementById("Pilotip_Satellite");
    if (message === "1") {
        inputVal.style.backgroundColor = "green";
        inputVal.value = "Healthy";
    } else {
        inputVal.style.backgroundColor = "red";
        inputVal.value = "Failed";
    }
}

function getSatelliteTasksStatus(message:string):void {
    let inputVal:HTMLInputElement = <HTMLInputElement>document.getElementById("Pilotip_Satellite_Tasks_Status");
    if (message === "1") {
        inputVal.style.backgroundColor = "green";
        inputVal.value = "Started";
    } else {
        inputVal.style.backgroundColor = "red";
        inputVal.value = "Stopped";
    }
}

function getSatelliteTasksLapses(message:string):void {
    let message_splitted:string[] = message.split(";");
    if (message_splitted.length === 2) {
        (<HTMLInputElement>document.getElementById("Pilotip_Satellite_Tasks_Lapse")).value = message_splitted[0];
        (<HTMLInputElement>document.getElementById("Pilotip_Satellite_Tasks_Countdown")).value = message_splitted[1];
    } else {
        (<HTMLInputElement>document.getElementById("Pilotip_Satellite_Tasks_Lapse")).value = "Undefined";
        (<HTMLInputElement>document.getElementById("Pilotip_Satellite_Tasks_Countdown")).value = "Undefined";
    }
}

function setSatelliteTasksLapses():void {
    let lapse:string = (<HTMLInputElement>document.getElementById("Pilotip_Satellite_Tasks_Lapse")).value;
    let value_lapse:number = parseInt(lapse, 10);
    if (isNaN(value_lapse) || (value_lapse <= 0)) {
        writeMessageToPilotipConsole("Wrong value of lapse");
        return;
    }
    let countdown:string = (<HTMLInputElement>document.getElementById("Pilotip_Satellite_Tasks_Countdown")).value;
    let value_countdown:number = parseInt(countdown, 10);
    if (isNaN(value_countdown) || (value_countdown <= 0)) {
        writeMessageToPilotipConsole("Wrong value of countdown");
        return;
    }
    if (value_lapse >= value_countdown) {
        writeMessageToPilotipConsole("Lapse must be less of Countdown");
        return;
    }
    let command:string = "setlapse " + value_lapse + ";" + value_countdown;
    let mqtt_message:any = new Paho.MQTT.Message(command);
    mqtt_message.destinationName = "pilotip/tasks/satellite/command";
    mqtt.send(mqtt_message);
    writeMessageToPilotipConsole("Sending new Satellite Task Lapses values...");
}