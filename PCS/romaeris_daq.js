    var navio1_timeout_counter        = 0;
	 var navio1_timeout_val            = 0;
	 var navio2_timeout_counter        = 0;
	 var navio2_timeout_val            = 0;
    var gateway_timeout_counter       = 0;
	 var gateway_timeout_val           = 0;
    var wingtip1_timeout_counter      = 0;
	 var wingtip1_timeout_val          = 0;
    var wingtip2_timeout_counter      = 0;
	 var wingtip2_timeout_val          = 0;
    var keelshift1_timeout_counter    = 0;
	 var keelshift1_timeout_val        = 0;
    var keelshift2_timeout_counter    = 0;
	 var keelshift2_timeout_val        = 0;
	 var winch1_timeout_counter        = 0;
	 var winch1_timeout_val            = 0;
    var winch2_timeout_counter        = 0;
	 var winch2_timeout_val            = 0;
    var winch3_timeout_counter        = 0;
	 var winch3_timeout_val            = 0;
    var forcebar_timeout_counter      = 0;
	 var forcebar_timeout_val          = 0;
	 var engine_timeout_counter        = 0;
	 var engine_timeout_val            = 0;
	 var camera_timeout_counter        = 0;
	 var camera_timeout_val            = 0;
    var ramp_cmd_active               = 0;
    var keelshift_left_duty_cycle_inc = 0;
    var keelshift_rght_duty_cycle_inc = 0;
    var winch_left_duty_cycle_inc     = 0;
    var winch_rght_duty_cycle_inc     = 0;
    var winch_ptch_duty_cycle_inc     = 0;
    var INCREMENT_DUTY_CYCLE          = 5;
    var MAX_DUTY_CYCLE                = 70;
    var pitch_linear_command_deg      = 0;
var roll_linear_command_deg = 0;

var sessionId = '';

    var inputVal;
    var mqtt;
    var reconnectTimeout = 2000;

    var actuator_state_left = 0;
    var actuator_state_right = 0;
    
    var actuator_state_leftwinch = 0;
    var actuator_state_rightwinch = 0;
    var actuator_state_pitchwinch = 0;
    
    var actuator_state_port = 0;
    var actuator_state_stbd = 0;

    var Navio1_Altitude_m_line = new TimeSeries();
    var Navio1_Airspeed_mps_line  = new TimeSeries();
    var Navio1_Throttle_Bar = new ProgressBar.Line(Navio1_div_box7, {
		   strokeWidth: 3,
  		   easing: 'easeInOut',
  			color: '#cc6600',
  			trailColor: '#262626',
  			trailWidth: 1,
  			svgStyle: {width: '30%', height: '150%'}
	});

	 var Navio2_Altitude_m_line = new TimeSeries();
    var Navio2_Airspeed_mps_line  = new TimeSeries();
    var Navio2_Throttle_Bar = new ProgressBar.Line(Navio2_div_box7, {
		   strokeWidth: 3,
  		   easing: 'easeInOut',
  			color: '#cc6600',
  			trailColor: '#262626',
  			trailWidth: 1,
  			svgStyle: {width: '30%', height: '150%'}
	});

	var Engine_Fuel_Bar = new ProgressBar.SemiCircle(Engine_fuel_box, {
		   strokeWidth: 8,
  		   easing: 'easeInOut',
  			color: '#cc6600',
  			trailColor: '#262626',
  			trailWidth: 3,
			svgStyle: null,
         duration: 1400,
  			from: {color: '#cc6600'},
  			to: {color: '#30db28'}

});

  	var Engine_Throttle_Bar = new ProgressBar.SemiCircle(Engine_throttle_box, {
		   strokeWidth: 8,
  		   easing: 'easeInOut',
  			color: '#30db28',
  			trailColor: '#262626',
  			trailWidth: 3,
  			//svgStyle: {width: '12%', height: '12%'}
			svgStyle: null,
         duration: 1400,
  			from: {color: '#30db28'},
  			to: {color: '#cc6600'}
});

  	var Engine_AirFuelMix_Bar = new ProgressBar.SemiCircle(Engine_airfuelmix_box, {
		   strokeWidth: 8,
  		   easing: 'easeInOut',
  			color: '#754896',
  			trailColor: '#262626',
  			trailWidth: 3,
  			//svgStyle: {width: '12%', height: '12%'}
			svgStyle: null,
         duration: 1400,
  			from: {color: '#754896'},
  			to: {color: '#cc6600'}
  });


var CHT_1_Bar = new ProgressBar.Line(CHT_div_box1, {
    strokeWidth: 10,
    easing: 'easeInOut',
    color: '#ff0000',
    trailColor: '#262626',
    trailWidth: 2,
    svgStyle: {
        width: '50%',
        height: '300%'
    }
});

var CHT_2_Bar = new ProgressBar.Line(CHT_div_box2, {
    strokeWidth: 10,
    easing: 'easeInOut',
    color: '#ff0000',
    trailColor: '#262626',
    trailWidth: 5,
    svgStyle: {
        width: '50%',
        height: '300%'
    }
});

    //Flight Indicators
    var Navio1_attitude = $.flightIndicator('#Navio1_attitude', 'attitude', {roll:00, pitch:00, size:350, showBox : true});
    var Navio1_heading  = $.flightIndicator('#Navio1_heading' , 'heading' , {heading:00, size:350, showBox:true});
	 var Navio1_attitude_winch = $.flightIndicator('#Navio1_attitude_winch', 'attitude', {roll:00, pitch:00, size:250, showBox : true});
	 
     //Flight Indicators
    var Navio2_attitude = $.flightIndicator('#Navio2_attitude', 'attitude', {roll:00, pitch:00, size:350, showBox : true});
    var Navio2_heading  = $.flightIndicator('#Navio2_heading' , 'heading' , {heading:00, size:350, showBox:true});

    var Engine_rpm      = $.flightIndicator('#Engine_rpm', 'airspeed', {airspeed:0, size:350, showBox : true});

	 var intervalID = setInterval(check_timeout, 1000);

    function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

    function MQTTconnect() {
	if (typeof path == "undefined") {
		path = '/mqtt';
	}
	mqtt = new Paho.MQTT.Client(
			host,
			port,
			path,
			"web_" + parseInt(Math.random() * 100, 10)
	);
        var options = {
            timeout: 3,
            useSSL: useTLS,
            cleanSession: cleansession,
            onSuccess: onConnect,
            onFailure: function (message) {
                $('#status').val("Connection failed: " + message.errorMessage + "Retrying");
                setTimeout(MQTTconnect, reconnectTimeout);
            }
        };

        mqtt.onConnectionLost = onConnectionLost;
        mqtt.onMessageArrived = onMessageArrived;

        if (username != null) {
            options.userName = username;
            options.password = password;
        }
        //console.log("Host="+ host + ", port=" + port + ", path=" + path + " TLS = " + useTLS + " username=" + username + " password=" + password);
        //mqtt.connect(options);
    }

    function onConnect() {
        $('#status').val('Connected to ' + host + ':' + port + path);
        var topic_list="";
        // Connection succeeded; subscribe to our topic list
        for (i = 0; i < topic.length; i++) {
    			 mqtt.subscribe(topic[i], {qos: 0});
    			 topic_list += topic[i];
				 topic_list += " || ";
			}
        $('#topic').val(topic_list);
    }

    function onConnectionLost(response) {
        setTimeout(MQTTconnect, reconnectTimeout);
        $('#status').val("connection lost: " + responseObject.errorMessage + ". Reconnecting");

    };

    function onMessageArrived(message) {
	var topic = message.destinationName;

	if(topic == 'pilotip/heartbeat'){
		getPilotipStatus(message.payloadString);
	}
	if(topic == 'pilotip/satellite/status'){
		getSatelliteStatus(message.payloadString);
	}
	if(topic == 'pilotip/tasks/satellite/status'){
		getSatelliteTasksStatus(message.payloadString);
	}
	if(topic == 'pilotip/tasks/satellite/lapses'){
		getSatelliteTasksLapses(message.payloadString);
	}
	if(topic == 'pilotip/pilot/message'){
		writeMessageToPilotipConsole(message.payloadString);
	}

	if(topic == 'navio1/message'){
//$('#ws').prepend('<li>' + 'NAVIO1 MESSAGE' + '</li>');
	  var payload = message.payloadBytes;
	  var buffer = new ArrayBuffer(39);
	  var byteview = new Uint8Array(buffer);

	  navio1_timeout_counter = 0;
	  navio1_timeout_val     = 0;

	  for(var i = 0; i < byteview.length; ++i) {
	    byteview[i] = payload[i];
	  }

	  var view = new DataView(buffer, 0);

	  var Navio_Data = {
	  AHRS_Healthy: view.getUint8(0, true),
	  IMU_Healthy: view.getUint8(1, true),
	  Airspeed_Healthy: view.getUint8(2, true),
	  GPS_numofsat: view.getInt32(3,true),
	  flight_mode: view.getInt32(7,true),
	  roll_deg: view.getInt32(11,true),
	  pitch_deg: view.getInt32(15,true),
	  yaw_deg: view.getInt32(19,true),
	  airspeed_mps: view.getInt32(23,true),
	  temp_C: view.getInt32(27,true),
     file_counter: view.getUint16(31,true),
     throttle_cmd: view.getUint16(33,true),
     altitude_m: view.getInt32(35,true) / 100
	  };


  Navio1_attitude.setRoll(Navio_Data.roll_deg);
  Navio1_attitude.setPitch(Navio_Data.pitch_deg);
  Navio1_attitude_winch.setRoll(Navio_Data.roll_deg);
  Navio1_attitude_winch.setPitch(Navio_Data.pitch_deg);
  Navio1_heading.setHeading(Navio_Data.yaw_deg);

  Navio1_Altitude_m_line.append(new Date().getTime(), Navio_Data.altitude_m);
  Navio1_Airspeed_mps_line.append(new Date().getTime(), Navio_Data.airspeed_mps);


    inputVal = document.getElementById("Navio1_File_Counter");
    inputVal.style.backgroundColor = "green";
    inputVal.value = "Number of Files: " + Navio_Data.file_counter;


    inputVal = document.getElementById("Navio1_AHRS_Healthy");
        if (Navio_Data.AHRS_Healthy == 1) {
            //updateText("Navio1_AHRS_Healthy", "Healthy", "green");
        inputVal.style.backgroundColor = "green";
        inputVal.value = "Healthy";
    }
        else {
            //updateText("Navio1_AHRS_Healthy", "Failed", "red");
    	  inputVal.style.backgroundColor = "red";
    	  inputVal.value = "Failed"
    }

    inputVal = document.getElementById("Navio1_IMU_Healthy");
        if (Navio_Data.IMU_Healthy == 1) {
            //updateText("Navio1_IMU_Healthy", "Healthy", "green");
        inputVal.style.backgroundColor = "green";
        inputVal.value = "Healthy";
    }
        else {
            //updateText("Navio1_IMU_Healthy", "Failed", "red");
    	  inputVal.style.backgroundColor = "red";
    	  inputVal.value = "Failed"
    }

    inputVal = document.getElementById("Navio1_Airspeed_Healthy");
        if (Navio_Data.Airspeed_Healthy == 1) {
            //updateText("Navio1_Airspeed_Healthy", "Healthy", "green");
        inputVal.style.backgroundColor = "green";
        inputVal.value = "Healthy";
    }
        else {
            //updateText("Navio1_Airspeed_Healthy", "Failed", "red");
    	  inputVal.style.backgroundColor = "red";
    	  inputVal.value = "Failed"
        }

    inputVal = document.getElementById("Navio1_Number_of_Satellites");
    inputVal.value = Navio_Data.GPS_numofsat;

    inputVal = document.getElementById("Navio1_Flight_Mode");
    if (Navio_Data.flight_mode == 1) {
    		inputVal.value = "MANUAL";
    }
    else if (Navio_Data.flight_mode == 2) {
			inputVal.value = "AUTOPILOT";
    }
    else if (Navio_Data.flight_mode == 3) {
    		inputVal.value = "NAVIGATION";
    }
    else if (Navio_Data.flight_mode == 0) {
    		inputVal.value = "PASSIVE";
    }
    else{
    	   inputVal.value = "UNKNOWN";
    }


    inputVal = document.getElementById("Navio1_Temperature");
    inputVal.value = Navio_Data.temp_C;

    Navio1_Throttle_Bar.set(Navio_Data.throttle_cmd/100);


	}

	if(topic == 'navio2/message'){
//$('#ws').prepend('<li>' + 'NAVIO2 MESSAGE' + '</li>');
	  var payload = message.payloadBytes;
	  var buffer = new ArrayBuffer(39);
	  var byteview = new Uint8Array(buffer);

	  navio2_timeout_counter = 0;
	  navio2_timeout_val     = 0;

	  for(var i = 0; i < byteview.length; ++i) {
	    byteview[i] = payload[i];
	  }

	  var view = new DataView(buffer, 0);

	  var Navio_Data = {
	  AHRS_Healthy: view.getUint8(0, true),
	  IMU_Healthy: view.getUint8(1, true),
	  Airspeed_Healthy: view.getUint8(2, true),
	  GPS_numofsat: view.getInt32(3,true),
	  flight_mode: view.getInt32(7,true),
	  roll_deg: view.getInt32(11,true),
	  pitch_deg: view.getInt32(15,true),
	  yaw_deg: view.getInt32(19,true),
	  airspeed_mps: view.getInt32(23,true),
	  temp_C: view.getInt32(27,true),
     file_counter: view.getUint16(31,true),
     throttle_cmd: view.getUint16(33,true),
     altitude_m: view.getInt32(35,true) / 100
	  };


  Navio2_attitude.setRoll(Navio_Data.roll_deg);
  Navio2_attitude.setPitch(Navio_Data.pitch_deg);
  Navio2_heading.setHeading(Navio_Data.yaw_deg);

  Navio2_Altitude_m_line.append(new Date().getTime(), Navio_Data.altitude_m);
  Navio2_Airspeed_mps_line.append(new Date().getTime(), Navio_Data.airspeed_mps);


    inputVal = document.getElementById("Navio2_File_Counter");
    inputVal.style.backgroundColor = "green";
    inputVal.value = "Number of Files: " + Navio_Data.file_counter;


    inputVal = document.getElementById("Navio2_AHRS_Healthy");
    if (Navio_Data.AHRS_Healthy == 1) {
        inputVal.style.backgroundColor = "green";
        inputVal.value = "Healthy";
    }
    else {
    	  inputVal.style.backgroundColor = "red";
    	  inputVal.value = "Failed"
    }

    inputVal = document.getElementById("Navio2_IMU_Healthy");
    if (Navio_Data.IMU_Healthy == 1) {
        inputVal.style.backgroundColor = "green";
        inputVal.value = "Healthy";
    }
    else {
    	  inputVal.style.backgroundColor = "red";
    	  inputVal.value = "Failed"
    }

    inputVal = document.getElementById("Navio2_Airspeed_Healthy");
    if (Navio_Data.Airspeed_Healthy == 1) {
        inputVal.style.backgroundColor = "green";
        inputVal.value = "Healthy";
    }
    else {
    	  inputVal.style.backgroundColor = "red";
    	  inputVal.value = "Failed"
    }
    inputVal = document.getElementById("Navio2_Number_of_Satellites");
    inputVal.value = Navio_Data.GPS_numofsat;

    inputVal = document.getElementById("Navio2_Flight_Mode");
    if (Navio_Data.flight_mode == 1) {
    		inputVal.value = "MANUAL";
    }
    else if (Navio_Data.flight_mode == 2) {
			inputVal.value = "AUTOPILOT";
    }
    else if (Navio_Data.flight_mode == 3) {
    		inputVal.value = "NAVIGATION";
    }
    else if (Navio_Data.flight_mode == 0) {
    		inputVal.value = "PASSIVE";
    }
    else{
    	   inputVal.value = "UNKNOWN";
    }


    inputVal = document.getElementById("Navio2_Temperature");
    inputVal.value = Navio_Data.temp_C;

    Navio2_Throttle_Bar.set(Navio_Data.throttle_cmd/100);


	}



if(topic == 'gateway/status'){
	//$('#ws').prepend('<li>' + 'status geldi' + '</li>');
	  var payload = message.payloadBytes;
	  var buffer = new ArrayBuffer(8);
	  var byteview = new Uint8Array(buffer);

	  gateway_timeout_counter = 0;
	  gateway_timeout_val     = 0;

	  for(var i = 0; i < byteview.length; ++i) {
	    byteview[i] = payload[i];
	  }

	  var view = new DataView(buffer, 0);

	  var data_recording  = view.getUint8(0, true);
	  var file_counter    = view.getUint16(1, true);
	  var busy_with_shell = view.getUint8(3, true);
	  var maneuver_counter  = view.getUint8(4, true);
	  var joystick_state = view.getUint8(6, true);
	  var joystick_mode = view.getUint8(7, true);	

	  
	  //$('#ws').prepend('<li>' + maneuver_index   + '</li>');
	 inputVal = document.getElementById("Recording_Status");
    if (data_recording == 1) {
    	  inputVal.style.backgroundColor = "green";
        inputVal.value = "Recording/ File: " + file_counter;
    }
    else {
    	  inputVal.style.backgroundColor = "red";
    	  inputVal.value = "Stopped-Total Files:" + + file_counter;
    }
    inputVal = document.getElementById("Gateway_Status");
    if (busy_with_shell == 0) {
    	  inputVal.style.backgroundColor = "green";
        inputVal.value = "Ready for Commands";
    }
    else {
    	  inputVal.style.backgroundColor = "red";
    	  inputVal.value = "Busy with Shell"
    }

	 inputVal = document.getElementById("Joystick_Mode");    
    if(joystick_mode == 0){
    	inputVal.value = "Manual";
    }
    else if(joystick_mode == 1){
	   inputVal.value = "Auto";    
    }
    else if(joystick_mode == 2){
	   inputVal.value = "Nav";    
    }
    else{
    	inputVal.value = "Unknown";
    }
    
    inputVal = document.getElementById("Joystick_State");    
    if(joystick_state == 0){
    	inputVal.value = "Disabled";
    }
    else if(joystick_state == 1){
	   inputVal.value = "Enabled";    
    }
    else{
    	inputVal.value = "Unknown";
    }
    
    inputVal = document.getElementById("Manuever_Counter");
    inputVal.style.backgroundColor = "green";
    inputVal.value = maneuver_counter;

}

if(topic == 'wingtip1/message'){

	  var payload = message.payloadBytes;
	  var buffer = new ArrayBuffer(135);
	  var byteview = new Uint8Array(buffer);
	  for(var i = 0; i < byteview.length; ++i) {
	    byteview[i] = payload[i];
	  }
 	  wingtip1_timeout_counter = 0;
	  wingtip1_timeout_val     = 0;

	  var view = new DataView(buffer, 0);
	  var encoder_pos_master = view.getInt32(37, true);
	  var encoder_pos_slave = view.getInt32(45, true);
     var min_pos     = view.getInt32(73, true);
     var max_pos     = view.getInt32(77, true);
     var engine_temp_master = view.getFloat32(61, true);
     var engine_temp_slave = view.getFloat32(65, true);
	  var GPS_Health_1   = view.getUint8(89, true);
     var current_master     = view.getInt16(53, true);
	  var current_slave     = view.getInt16(55, true);
	  var pot_position   = view.getInt16(90, true);
     var roll_TE        = view.getFloat32(104, true);
     var pitch_TE       = view.getFloat32(108, true);
     var yaw_TE         = view.getFloat32(112, true);
     var roll_LE        = view.getFloat32(116, true);
     var pitch_LE       = view.getFloat32(120, true);
     var yaw_LE         = view.getFloat32(124, true);
     actuator_state_port   = view.getInt32(131, true);
          //$('#ws').prepend('<li>' + (encoder_pos_master/max_pos)*100 + '</li>');
          max_pos = max_pos + 10;  //dead zone
          min_pos = min_pos - 10;     // dead_zone
     if(encoder_pos_master < 0){
		 Wingtip1_Bar_1.set((1-(encoder_pos_master/min_pos))/2);
	         Wingtip1_Bar_2.set((1-(encoder_pos_master/min_pos))/2);
		 }
	else if(encoder_pos_master > 0){
		 Wingtip1_Bar_1.set((0.5 +(encoder_pos_master/max_pos)/2));
	         Wingtip1_Bar_2.set((0.5 +(encoder_pos_master/max_pos)/2));
		}
	else{
		 Wingtip1_Bar_1.set(0.5);
	         Wingtip1_Bar_2.set(0.5);
		}


     inputVal = document.getElementById("Wingtip_1_GPS_Status_1");
     if (GPS_Health_1  == 1) {
    	  inputVal.style.backgroundColor = "green";
        inputVal.value = "Healthy";
     }
     else {
    	  inputVal.style.backgroundColor = "red";
    	  inputVal.value = "Fail"
     }
     inputVal = document.getElementById("Wingtip_1_GPS_Status_2");
     if (GPS_Health_1  == 1) {
    	  inputVal.style.backgroundColor = "green";
        inputVal.value = "Healthy";
     }
     else {
    	  inputVal.style.backgroundColor = "red";
    	  inputVal.value = "Fail"
     }

     inputVal = document.getElementById("Wingtip_1_MotorCurrent_1");
     inputVal.value = Number(current_master/100).toFixed(2)+ "//"+Number(current_slave/100).toFixed(2)
     if((current_master > 500) || (current_slave > 500)){
     	  inputVal.style.backgroundColor = "red";
     	}
     	else{
     	  inputVal.style.backgroundColor = "white";
     	}

     inputVal = document.getElementById("Wingtip_1_MotorCurrent_2");
     inputVal.value = Number(current_master/100).toFixed(2)+ "//"+Number(current_slave/100).toFixed(2)
     if((current_master > 500) || (current_slave > 500)){
     	  inputVal.style.backgroundColor = "red";
     	}
     	else{
     	  inputVal.style.backgroundColor = "white";
     	}
     
     inputVal = document.getElementById("Wingtip_1_MotorCurrent_3");
     inputVal.value = Number(current_master/100).toFixed(2)+ "//"+Number(current_slave/100).toFixed(2)
     if((current_master > 500) || (current_slave > 500)){
     	  inputVal.style.backgroundColor = "red";
     	}
     	else{
     	  inputVal.style.backgroundColor = "white";
     	}


     inputVal = document.getElementById("Wingtip_1_MotorTemp_1");
     inputVal.value = Number(engine_temp_master).toFixed(2)+ "//"+Number(engine_temp_slave).toFixed(2)

     inputVal = document.getElementById("Wingtip_1_MotorTemp_2");
     inputVal.value = Number(engine_temp_master).toFixed(2)+ "//"+Number(engine_temp_slave).toFixed(2)
     
     inputVal = document.getElementById("Wingtip_1_TE");
     inputVal.value = "R:" + Number(roll_TE).toFixed(2)+ "//P:" + Number(pitch_TE).toFixed(2)+ "//Y:" + Number(yaw_TE).toFixed(2)
     
          
     inputVal = document.getElementById("Wingtip_1_LE");
     inputVal.value = "R:" + Number(roll_LE).toFixed(2)+ "//P:" + Number(pitch_LE).toFixed(2)+ "//Y:" + Number(yaw_LE).toFixed(2)

     document.getElementById("Wingtip1_div_box_1_label").innerHTML = "P:" + encoder_pos_master +"/"+encoder_pos_slave;
     document.getElementById("Wingtip1_div_box_2_label").innerHTML = "P:" + encoder_pos_master +"/"+encoder_pos_slave;
     
     inputVal = document.getElementById("Activate_Port_Button_Id");
     if(actuator_state_port > 1){
    	 inputVal.style.backgroundColor = "green";
    	 inputVal.innerHTML = "Disable"
     }
     else{
    	 inputVal.style.backgroundColor = "red";
    	 inputVal.innerHTML = "Activate"
     }

}

if(topic == 'wingtip2/message'){

	  var payload = message.payloadBytes;
	  var buffer = new ArrayBuffer(135);
	  var byteview = new Uint8Array(buffer);
	  for(var i = 0; i < byteview.length; ++i) {
	    byteview[i] = payload[i];
	  }
 	  wingtip2_timeout_counter = 0;
	  wingtip2_timeout_val     = 0;

	  var view = new DataView(buffer, 0);
	  var encoder_pos_master = view.getInt32(37, true);
	  var encoder_pos_slave = view.getInt32(45, true);
     var min_pos     = view.getInt32(73, true);
     var max_pos     = view.getInt32(77, true);
     var engine_temp_master = view.getFloat32(61, true);
     var engine_temp_slave = view.getFloat32(65, true);
	  var GPS_Health_2   = view.getUint8(89, true);
     var current_master     = view.getInt16(53, true);
	  var current_slave     = view.getInt16(55, true);
	  var pot_position   = view.getInt16(90, true);
     var roll_TE        = view.getFloat32(104, true);
     var pitch_TE       = view.getFloat32(108, true);
     var yaw_TE         = view.getFloat32(112, true);
     var roll_LE        = view.getFloat32(116, true);
     var pitch_LE       = view.getFloat32(120, true);
     var yaw_LE         = view.getFloat32(124, true);
     actuator_state_stbd   = view.getInt32(131, true);
          //$('#ws').prepend('<li>' + actuator_state_stbd + '</li>');
          max_pos = max_pos + 10;  //dead zone
          min_pos = min_pos - 10;     // dead_zone
     if(encoder_pos_master < 0){
		 Wingtip2_Bar_1.set((1-(encoder_pos_master/min_pos))/2);
	     Wingtip2_Bar_2.set((1-(encoder_pos_master/min_pos))/2);
		 }
	else if(encoder_pos_master > 0){
		 Wingtip2_Bar_1.set((0.5 +(encoder_pos_master/max_pos)/2));
	     Wingtip2_Bar_2.set((0.5 +(encoder_pos_master/max_pos)/2));
		}
	else{
		 Wingtip2_Bar_1.set(0.5);
	     Wingtip2_Bar_2.set(0.5);
		}

     inputVal = document.getElementById("Wingtip_2_GPS_Status_1");
     if (GPS_Health_2  == 1) {
    	  inputVal.style.backgroundColor = "green";
        inputVal.value = "Healthy";
     }
     else {
    	  inputVal.style.backgroundColor = "red";
    	  inputVal.value = "Fail"
     }
     inputVal = document.getElementById("Wingtip_2_GPS_Status_2");
     if (GPS_Health_2  == 1) {
    	  inputVal.style.backgroundColor = "green";
        inputVal.value = "Healthy";
     }
     else {
    	  inputVal.style.backgroundColor = "red";
    	  inputVal.value = "Fail"
     }

     inputVal = document.getElementById("Wingtip_2_MotorCurrent_1");
     inputVal.value = Number(current_master/100).toFixed(2)+ "//"+Number(current_slave/100).toFixed(2)
     if((current_master > 500) || (current_slave > 500)){
     	  inputVal.style.backgroundColor = "red";
     	}
     	else{
     	  inputVal.style.backgroundColor = "white";
     	}

     inputVal = document.getElementById("Wingtip_2_MotorCurrent_2");
     inputVal.value = Number(current_master/100).toFixed(2)+ "//"+Number(current_slave/100).toFixed(2)
     if((current_master > 500) || (current_slave > 500)){
     	  inputVal.style.backgroundColor = "red";
     	}
     	else{
     	  inputVal.style.backgroundColor = "white";
     	}
     
     inputVal = document.getElementById("Wingtip_2_MotorCurrent_3");
     inputVal.value = Number(current_master/100).toFixed(2)+ "//"+Number(current_slave/100).toFixed(2)
     if((current_master > 500) || (current_slave > 500)){
     	  inputVal.style.backgroundColor = "red";
     	}
     	else{
     	  inputVal.style.backgroundColor = "white";
     	}

     inputVal = document.getElementById("Wingtip_2_MotorTemp_1");
     inputVal.value = Number(engine_temp_master).toFixed(2)+ "//"+Number(engine_temp_slave).toFixed(2)

     inputVal = document.getElementById("Wingtip_2_MotorTemp_2");
     inputVal.value = Number(engine_temp_master).toFixed(2)+ "//"+Number(engine_temp_slave).toFixed(2)
     
     inputVal = document.getElementById("Wingtip_2_TE");
     inputVal.value = "R:" + Number(roll_TE).toFixed(2)+ "//P:" + Number(pitch_TE).toFixed(2)+ "//Y:" + Number(yaw_TE).toFixed(2)
     
          
     inputVal = document.getElementById("Wingtip_2_LE");
     inputVal.value = "R:" + Number(roll_LE).toFixed(2)+ "//P:" + Number(pitch_LE).toFixed(2)+ "//Y:" + Number(yaw_LE).toFixed(2)
     

     document.getElementById("Wingtip2_div_box_1_label").innerHTML = "S:" + encoder_pos_master+"/"+encoder_pos_slave;
     document.getElementById("Wingtip2_div_box_2_label").innerHTML = "S:" + encoder_pos_master+"/"+encoder_pos_slave;
     
     inputVal = document.getElementById("Activate_Stbd_Button_Id");
     if(actuator_state_stbd > 1){
    	 inputVal.style.backgroundColor = "green";
    	 inputVal.innerHTML = "Disable"
     }
     else{
    	 inputVal.style.backgroundColor = "red";
    	 inputVal.innerHTML = "Activate"
     }

    
     
}


if(topic == 'keelshift1/message'){

	  var payload = message.payloadBytes;
	  var buffer = new ArrayBuffer(135);
	  var byteview = new Uint8Array(buffer);
	  for(var i = 0; i < byteview.length; ++i) {
	    byteview[i] = payload[i];
	  }
 	  keelshift1_timeout_counter = 0;
	  keelshift1_timeout_val     = 0;

	  var view = new DataView(buffer, 0);
	  var encoder_pos_master = view.getInt32(37, true);
	  var encoder_pos_slave = view.getInt32(45, true);
     var engine_temp_master = view.getFloat32(61, true);
     var engine_temp_slave = view.getFloat32(65, true);
	  var GPS_Health        = view.getUint8(89, true);
     var current_master     = view.getInt16(53, true);
	  var current_slave     = view.getInt16(55, true);
	  var pot_position   = view.getInt16(90, true);
     var min_pos     = -5000;
     var max_pos     = 5000;
	  actuator_state_left   = view.getInt32(131, true);

	  var bar_position = encoder_pos_master / (max_pos - min_pos);
	  bar_position = bar_position + 0.5;
	  
	  if(bar_position >1)
	  {bar_position = 1}
	  else if(bar_position < 0)
	  {bar_position = 0;}
	
	  Keelshift1_Bar.set(bar_position);

     inputVal = document.getElementById("Keelshift_1_GPS_Status_1");
     if (GPS_Health  == 1) {
    	  inputVal.style.backgroundColor = "green";
        inputVal.value = "Healthy";
     }
     else {
    	  inputVal.style.backgroundColor = "red";
    	  inputVal.value = "Fail"
     }

     inputVal = document.getElementById("Keelshift_1_MotorCurrent_1");
     inputVal.value = Number(current_master/100).toFixed(2)+ "//"+Number(current_slave/100).toFixed(2)
     if((current_master > 500) || (current_slave > 500)){
     	  inputVal.style.backgroundColor = "red";
     	}
     	else{
     	  inputVal.style.backgroundColor = "white";
     	}
     
     inputVal = document.getElementById("Keelshift_1_MotorCurrent_2");
     inputVal.value = Number(current_master/100).toFixed(2)+ "//"+Number(current_slave/100).toFixed(2)
     if((current_master > 500) || (current_slave > 500)){
     	  inputVal.style.backgroundColor = "red";
     	}
     	else{
     	  inputVal.style.backgroundColor = "white";
     	}

     inputVal = document.getElementById("Keelshift_1_MotorTemp_1");
     inputVal.value = Number(engine_temp_master).toFixed(2)+ "//"+Number(engine_temp_slave).toFixed(2)

     inputVal = document.getElementById("Activate_Left_Button_Id");
     if(actuator_state_left > 1){
    	 inputVal.style.backgroundColor = "green";
    	 inputVal.innerHTML = "Disable"
     }
     else{
    	 inputVal.style.backgroundColor = "red";
    	 inputVal.innerHTML = "Activate"
     }
     
     document.getElementById("Keelshift1_div_box_1_label").innerHTML = "Left Enc: " + encoder_pos_master;

}


if(topic == 'keelshift2/message'){
//$('#ws').prepend('<li>' + 'keelshift2 '+ '</li>');
	  var payload = message.payloadBytes;
	  var buffer = new ArrayBuffer(135);
	  var byteview = new Uint8Array(buffer);
	  for(var i = 0; i < byteview.length; ++i) {
	    byteview[i] = payload[i];
	  }
 	  keelshift2_timeout_counter = 0;
	  keelshift2_timeout_val     = 0;

	  var view = new DataView(buffer, 0);
	  var encoder_pos_master = view.getInt32(37, true);
	  var encoder_pos_slave = view.getInt32(45, true);
     var engine_temp_master = view.getFloat32(61, true);
     var engine_temp_slave = view.getFloat32(65, true);
	  var GPS_Health        = view.getUint8(89, true);
     var current_master     = view.getInt16(53, true);
	  var current_slave     = view.getInt16(55, true);
	  var pot_position   = view.getInt16(90, true);
     var min_pos     = -5000;
     var max_pos     = 5000;
	  actuator_state_right   = view.getInt32(131, true);

	  var bar_position = encoder_pos_master / (max_pos - min_pos);
	  bar_position = bar_position + 0.5;
	  
	  if(bar_position >1)
	  {bar_position = 1}
	  else if(bar_position < 0)
	  {bar_position = 0;}
	
	  Keelshift2_Bar.set(bar_position);

     inputVal = document.getElementById("Keelshift_2_GPS_Status_1");
     if (GPS_Health  == 1) {
    	  inputVal.style.backgroundColor = "green";
        inputVal.value = "Healthy";
     }
     else {
    	  inputVal.style.backgroundColor = "red";
    	  inputVal.value = "Fail"
     }

     inputVal = document.getElementById("Keelshift_2_MotorCurrent_1");
     inputVal.value = Number(current_master/100).toFixed(2)+ "//"+Number(current_slave/100).toFixed(2)
     if((current_master > 500) || (current_slave > 500)){
     	  inputVal.style.backgroundColor = "red";
     	}
     	else{
     	  inputVal.style.backgroundColor = "white";
     	}
     
     inputVal = document.getElementById("Keelshift_2_MotorCurrent_2");
     inputVal.value = Number(current_master/100).toFixed(2)+ "//"+Number(current_slave/100).toFixed(2)
     if((current_master > 500) || (current_slave > 500)){
     	  inputVal.style.backgroundColor = "red";
     	}
     	else{
     	  inputVal.style.backgroundColor = "white";
     	}

     inputVal = document.getElementById("Keelshift_2_MotorTemp_1");
     inputVal.value = Number(engine_temp_master).toFixed(2)+ "//"+Number(engine_temp_slave).toFixed(2)

     inputVal = document.getElementById("Activate_Right_Button_Id");
     if(actuator_state_right > 1){
    	 inputVal.style.backgroundColor = "green";
    	 inputVal.innerHTML = "Disable"
     }
     else{
    	 inputVal.style.backgroundColor = "red";
    	 inputVal.innerHTML = "Activate"
     }
     
     document.getElementById("Keelshift2_div_box_1_label").innerHTML = "Rght Enc: " + encoder_pos_master;
}


if(topic == 'winch1/message'){
	  var payload = message.payloadBytes;
	  var buffer = new ArrayBuffer(135);
	  var byteview = new Uint8Array(buffer);
	  for(var i = 0; i < byteview.length; ++i) {
	    byteview[i] = payload[i];
	  }
 	  winch1_timeout_counter = 0;
	  winch1_timeout_val     = 0;

	  var view = new DataView(buffer, 0);
	  var encoder_pos_master = view.getInt32(37, true);
	  var encoder_pos_slave = view.getInt32(45, true);
     var engine_temp_master = view.getFloat32(61, true);
     var engine_temp_slave = view.getFloat32(65, true);
	  var GPS_Health        = view.getUint8(89, true);
     var current_master     = view.getInt16(53, true);
	  var current_slave     = view.getInt16(55, true);
	  var pot_position   = view.getInt16(90, true);
     var min_pos     = -5000;
     var max_pos     = 5000;
	  actuator_state_leftwinch   = view.getInt32(131, true);

	  var bar_position = encoder_pos_master / (max_pos - min_pos);
	  bar_position = bar_position + 0.5;
	  
	  if(bar_position >1)
	  {bar_position = 1}
	  else if(bar_position < 0)
	  {bar_position = 0;}
	
	  Winch1_Bar.set(bar_position);

     inputVal = document.getElementById("Winch_1_GPS_Status_1");
     if (GPS_Health  == 1) {
    	  inputVal.style.backgroundColor = "green";
        inputVal.value = "Healthy";
     }
     else {
    	  inputVal.style.backgroundColor = "red";
    	  inputVal.value = "Fail"
     }

     inputVal = document.getElementById("Winch_1_MotorCurrent_1");
     inputVal.value = Number(current_master/100).toFixed(2)+ "//"+Number(current_slave/100).toFixed(2)
     if((current_master > 500) || (current_slave > 500)){
     	  inputVal.style.backgroundColor = "red";
     	}
     	else{
     	  inputVal.style.backgroundColor = "white";
     	}
     
     inputVal = document.getElementById("Winch_1_MotorTemp_1");
     inputVal.value = Number(engine_temp_master).toFixed(2)+ "//"+Number(engine_temp_slave).toFixed(2)

     inputVal = document.getElementById("Activate_LeftWinch_Button_Id");
     if(actuator_state_leftwinch > 1){
    	 inputVal.style.backgroundColor = "green";
    	 inputVal.innerHTML = "Disable"
     }
     else{
    	 inputVal.style.backgroundColor = "red";
    	 inputVal.innerHTML = "Activate"
     }
     
     document.getElementById("Winch1_div_box_1_label").innerHTML = "Left Enc:  <br/>" + encoder_pos_master;

}

if(topic == 'winch2/message'){
	  var payload = message.payloadBytes;
	  var buffer = new ArrayBuffer(135);
	  var byteview = new Uint8Array(buffer);
	  for(var i = 0; i < byteview.length; ++i) {
	    byteview[i] = payload[i];
	  }
 	  winch2_timeout_counter = 0;
	  winch2_timeout_val     = 0;

	  var view = new DataView(buffer, 0);
	  var encoder_pos_master = view.getInt32(37, true);
	  var encoder_pos_slave = view.getInt32(45, true);
     var engine_temp_master = view.getFloat32(61, true);
     var engine_temp_slave = view.getFloat32(65, true);
	  var GPS_Health        = view.getUint8(89, true);
     var current_master     = view.getInt16(53, true);
	  var current_slave     = view.getInt16(55, true);
	  var pot_position   = view.getInt16(90, true);
     var min_pos     = -5000;
     var max_pos     = 5000;
	  actuator_state_rightwinch   = view.getInt32(131, true);

	  var bar_position = encoder_pos_master / (max_pos - min_pos);
	  bar_position = bar_position + 0.5;
	  
	  if(bar_position >1)
	  {bar_position = 1}
	  else if(bar_position < 0)
	  {bar_position = 0;}
	
	  Winch2_Bar.set(bar_position);

     inputVal = document.getElementById("Winch_2_GPS_Status_1");
     if (GPS_Health  == 1) {
    	  inputVal.style.backgroundColor = "green";
        inputVal.value = "Healthy";
     }
     else {
    	  inputVal.style.backgroundColor = "red";
    	  inputVal.value = "Fail"
     }

     inputVal = document.getElementById("Winch_2_MotorCurrent_1");
     inputVal.value = Number(current_master/100).toFixed(2)+ "//"+Number(current_slave/100).toFixed(2)
     if((current_master > 500) || (current_slave > 500)){
     	  inputVal.style.backgroundColor = "red";
     	}
     	else{
     	  inputVal.style.backgroundColor = "white";
     	}
     
     inputVal = document.getElementById("Winch_2_MotorTemp_1");
     inputVal.value = Number(engine_temp_master).toFixed(2)+ "//"+Number(engine_temp_slave).toFixed(2)

     inputVal = document.getElementById("Activate_RightWinch_Button_Id");
     if(actuator_state_rightwinch > 1){
    	 inputVal.style.backgroundColor = "green";
    	 inputVal.innerHTML = "Disable"
     }
     else{
    	 inputVal.style.backgroundColor = "red";
    	 inputVal.innerHTML = "Activate"
     }
     
     document.getElementById("Winch2_div_box_1_label").innerHTML = "Rght Enc:  <br/>" + encoder_pos_master;

}


if(topic == 'winch3/message'){
	  var payload = message.payloadBytes;
	  var buffer = new ArrayBuffer(135);
	  var byteview = new Uint8Array(buffer);
	  for(var i = 0; i < byteview.length; ++i) {
	    byteview[i] = payload[i];
	  }
 	  winch3_timeout_counter = 0;
	  winch3_timeout_val     = 0;

	  var view = new DataView(buffer, 0);
	  var encoder_pos_master = view.getInt32(37, true);
	  var encoder_pos_slave = view.getInt32(45, true);
     var engine_temp_master = view.getFloat32(61, true);
     var engine_temp_slave = view.getFloat32(65, true);
	  var GPS_Health        = view.getUint8(89, true);
     var current_master     = view.getInt16(53, true);
	  var current_slave     = view.getInt16(55, true);
	  var pot_position   = view.getInt16(90, true);
     var min_pos     = -5000;
     var max_pos     = 5000;
	  actuator_state_pitchwinch   = view.getInt32(131, true);
	  var bar_position = encoder_pos_master / (max_pos - min_pos);
	  bar_position = bar_position + 0.5;
	  
	  if(bar_position >1)
	  {bar_position = 1}
	  else if(bar_position < 0)
	  {bar_position = 0;}
	
	  Winch3_Bar.set(bar_position);

     inputVal = document.getElementById("Winch_3_GPS_Status_1");
     if (GPS_Health  == 1) {
    	  inputVal.style.backgroundColor = "green";
        inputVal.value = "Healthy";
     }
     else {
    	  inputVal.style.backgroundColor = "red";
    	  inputVal.value = "Fail"
     }

     inputVal = document.getElementById("Winch_3_MotorCurrent_1");
     inputVal.value = Number(current_master/100).toFixed(2)+ "//"+Number(current_slave/100).toFixed(2)
     if((current_master > 500) || (current_slave > 500)){
     	  inputVal.style.backgroundColor = "red";
     	}
     	else{
     	  inputVal.style.backgroundColor = "white";
     	}
     
     inputVal = document.getElementById("Winch_3_MotorTemp_1");
     inputVal.value = Number(engine_temp_master).toFixed(2)+ "//"+Number(engine_temp_slave).toFixed(2)
     inputVal = document.getElementById("Activate_PitchWinch_Button_Id");
     if(actuator_state_pitchwinch > 1){

    	 inputVal.style.backgroundColor = "green";
    	 inputVal.innerHTML = "Disable"
     }
     else{
    	 inputVal.style.backgroundColor = "red";
    	 inputVal.innerHTML = "Activate"
     }
     
     document.getElementById("Winch3_div_box_1_label").innerHTML = "Pitch Enc:  <br/>" + encoder_pos_master;

}

if(topic == 'forcebar/message'){
	  var payload = message.payloadBytes;
	  var buffer = new ArrayBuffer(7);
	  var byteview = new Uint8Array(buffer);
	  for(var i = 0; i < byteview.length; ++i) {
	    byteview[i] = payload[i];
	  }
 	  forcebar_timeout_counter = 0;
	  forcebar_timeout_val     = 0;

	  var view = new DataView(buffer, 0);
	  var GPS_Healthy          = view.getUint8(0, true);
     var OptoForce_1_Healthy  = view.getUint8(1, true);
     var OptoForce_2_Healthy  = view.getUint8(2, true);
     var LoadCell_1_Healthy   = view.getUint8(3, true);
     var LoadCell_2_Healthy   = view.getUint8(4, true);
     var LoadCell_3_Healthy   = view.getUint8(5, true);
     var LoadCell_4_Healthy   = view.getUint8(6, true);


     inputVal = document.getElementById("Force_Bar_GPS_Status");
     if (GPS_Healthy == 1) {
    	  inputVal.style.backgroundColor = "green";
        inputVal.value = "Healthy";
     }
     else {
    	  inputVal.style.backgroundColor = "red";
    	  inputVal.value = "Fail"
     }

     inputVal = document.getElementById("Force_Bar_OptoForce_1_Status");
     if (OptoForce_1_Healthy == 1) {
    	  inputVal.style.backgroundColor = "green";
        inputVal.value = "Healthy";
     }
     else {
    	  inputVal.style.backgroundColor = "red";
    	  inputVal.value = "Fail"
     }
     inputVal = document.getElementById("Force_Bar_OptoForce_2_Status");
     if (OptoForce_2_Healthy == 1) {
    	  inputVal.style.backgroundColor = "green";
        inputVal.value = "Healthy";
     }
     else {
    	  inputVal.style.backgroundColor = "red";
    	  inputVal.value = "Fail"
     }

     inputVal = document.getElementById("Force_Bar_LoadCell_1_Status");
     if (LoadCell_1_Healthy == 1) {
    	  inputVal.style.backgroundColor = "green";
        inputVal.value = "Healthy";
     }
     else {
    	  inputVal.style.backgroundColor = "red";
    	  inputVal.value = "Fail"
     }
     inputVal = document.getElementById("Force_Bar_LoadCell_2_Status");
     if (LoadCell_2_Healthy == 1) {
    	  inputVal.style.backgroundColor = "green";
        inputVal.value = "Healthy";
     }
     else {
    	  inputVal.style.backgroundColor = "red";
    	  inputVal.value = "Fail"
     }
     inputVal = document.getElementById("Force_Bar_LoadCell_3_Status");
     if (LoadCell_3_Healthy == 1) {
    	  inputVal.style.backgroundColor = "green";
        inputVal.value = "Healthy";
     }
     else {
    	  inputVal.style.backgroundColor = "red";
    	  inputVal.value = "Fail"
     }
     inputVal = document.getElementById("Force_Bar_LoadCell_4_Status");
     if (LoadCell_4_Healthy == 1) {
    	  inputVal.style.backgroundColor = "green";
        inputVal.value = "Healthy";
     }
     else {
    	  inputVal.style.backgroundColor = "red";
    	  inputVal.value = "Fail"
     }

}


if(topic == 'engine/message'){

	  var payload = message.payloadBytes;
	  var buffer = new ArrayBuffer(84);
	  var byteview = new Uint8Array(buffer);
	  for(var i = 0; i < byteview.length; ++i) {
	    byteview[i] = payload[i];
	  }
 	  engine_timeout_counter = 0;
	  engine_timeout_val     = 0;

	  var view = new DataView(buffer, 0);


	  var CHT1        = view.getInt32(0, true);
	  var CHT2        = view.getInt32(4, true);
	  var EGT1        = view.getInt32(8, true);
	  var EGT2        = view.getInt32(12, true);
	  var CARB1       = view.getInt32(16, true);
     var CARB2       = view.getInt32(20, true);
     var INLET       = view.getInt32(24, true);
     var GEARBOX     = view.getInt32(28, true);
     var RPM         = view.getInt32(32, true);
	  var LOW_OIL     = view.getUint8(36, true);
 	  var FUEL_LEVEL  = view.getInt32(37, true);
	  var AUX_PUMP    = view.getUint8(41, true);
	  var AFR         = view.getInt32(42, true);
	  var MAN1        = view.getInt32(46, true);
	  var MAN2        = view.getInt32(50, true);
     var START_LED   = view.getUint8(54, true);
     var SYS_VOLTAGE = view.getInt32(55, true);
     var THROTTLE    = view.getInt32(59, true);
     var HUMIDITY    = view.getInt32(63, true);
     var GPS_HEALTH  = view.getUint8(79, true);


     inputVal = document.getElementById("Engine_Inlet_Temp");
     inputVal.value = INLET / 100;

     inputVal = document.getElementById("Engine_Gearbox_Temp");
     inputVal.value = GEARBOX / 100;

     inputVal = document.getElementById("Engine_CylinderHead1_Temp");
     inputVal.value = CHT1 / 100;

     inputVal = document.getElementById("Engine_CylinderHead2_Temp");
     inputVal.value = CHT2 / 100;

     inputVal = document.getElementById("Engine_Carburetor1_Temp");
     inputVal.value = CARB1 / 100;

     inputVal = document.getElementById("Engine_Carburetor2_Temp");
     inputVal.value = CARB2 / 100;

     inputVal = document.getElementById("Engine_ExhaustGas1_Temp");
     inputVal.value = EGT1 / 100;

     inputVal = document.getElementById("Engine_ExhaustGas2_Temp");
     inputVal.value = EGT2 / 100;

     inputVal = document.getElementById("Engine_Voltage");
     inputVal.value = SYS_VOLTAGE / 10;

     inputVal = document.getElementById("Engine_Humidity");
     inputVal.value = HUMIDITY;

     inputVal = document.getElementById("Engine_Manifold1_Pressure");
     inputVal.value = MAN1;


     inputVal = document.getElementById("Engine_Manifold2_Pressure");
     inputVal.value = MAN2;


     inputVal = document.getElementById("Engine_Low_Oil");
     if (LOW_OIL == 1) {
    	  inputVal.style.backgroundColor = "red";
        inputVal.value = "EMPTY";
     }
     else {
    	  inputVal.style.backgroundColor = "green";
    	  inputVal.value = "FULL"
     }

     inputVal = document.getElementById("Engine_AuxPump");
     if (AUX_PUMP == 0) {
    	  inputVal.style.backgroundColor = "red";
        inputVal.value = "OFF";
     }
     else {
    	  inputVal.style.backgroundColor = "green";
    	  inputVal.value = "ON"
     }

     inputVal = document.getElementById("Engine_Gps");
     if (GPS_HEALTH == 0) {
    	  inputVal.style.backgroundColor = "red";
        inputVal.value = "FAIL";
     }
     else {
    	  inputVal.style.backgroundColor = "green";
    	  inputVal.value = "HEALTHY"
     }

    if (START_LED == 0) {
        updateText("Engine_Started", "STOP", "red");
    }
    else {
        updateText("Engine_Started", "START", "green"); 
    }

	  Engine_rpm.setAirSpeed((RPM * 160) / 8000);
	  Engine_Fuel_Bar.set(FUEL_LEVEL / 100);
	  Engine_Throttle_Bar.set(THROTTLE / 100);
	  Engine_AirFuelMix_Bar.set(AFR / 100);

}

if(topic == 'camera/message'){
	//$('#ws').prepend('<li>' + 'camera message' + '</li>');
	var payload = message.payloadBytes;
	var buffer = new ArrayBuffer(3);
	var byteview = new Uint8Array(buffer);

	camera_timeout_counter = 0;
	camera_timeout_val     = 0;

	for(var i = 0; i < byteview.length; ++i) {
	    byteview[i] = payload[i];
	}

	var view = new DataView(buffer, 0);
	var camera_status     = view.getUint8(0, true);
	var file_counter      = view.getUint8(1, true);
	var camera_gps_status = view.getUint8(2, true);

    if (camera_status == 0) {
        updateText("Camera_GPS_Status", "Not Recording:last file " + file_counter, "red");
    }
    else if (camera_status == 1) {
        updateText("Camera_GPS_Status", "Recording:file " + file_counter, "green");
    }
    else if (camera_status == 2) {
        updateText("Camera_GPS_Status", "RTSP Mode", "yellow");     
    }
     
    if (camera_gps_status == 0) {
        updateText("Camera_GPS_Status", "Failed", "red");
    }
    else if (camera_gps_status == 1) {
        updateText("Camera_GPS_Status", "Healthy", "green");
    }

}



};

    function createTimeline() {
        var chart1 = new SmoothieChart({labels:{fillStyle:'#c1a4a4'},timestampFormatter:SmoothieChart.timeFormatter});
        var chart2 = new SmoothieChart({labels:{fillStyle:'#c1a4a4'},timestampFormatter:SmoothieChart.timeFormatter});
        var chart3 = new SmoothieChart({labels:{fillStyle:'#c1a4a4'},timestampFormatter:SmoothieChart.timeFormatter});
        var chart4 = new SmoothieChart({labels:{fillStyle:'#c1a4a4'},timestampFormatter:SmoothieChart.timeFormatter});

		  chart1.addTimeSeries(Navio1_Altitude_m_line, { strokeStyle: 'rgba(0, 255, 0, 1)', fillStyle: 'rgba(0, 255, 0, 0.2)', lineWidth: 4 });
		  chart1.streamTo(document.getElementById("Navio1_altitude_chart"), 1000);

        chart2.addTimeSeries(Navio1_Airspeed_mps_line,  { strokeStyle: 'rgba(0, 255, 0, 1)', fillStyle: 'rgba(0, 255, 0, 0.2)', lineWidth: 4 });
        chart2.streamTo(document.getElementById("Navio1_airspeed_chart"),  1000);

        chart3.addTimeSeries(Navio2_Altitude_m_line, { strokeStyle: 'rgba(0, 255, 0, 1)', fillStyle: 'rgba(0, 255, 0, 0.2)', lineWidth: 4 });
		  chart3.streamTo(document.getElementById("Navio2_altitude_chart"), 1000);

        chart4.addTimeSeries(Navio2_Airspeed_mps_line,  { strokeStyle: 'rgba(0, 255, 0, 1)', fillStyle: 'rgba(0, 255, 0, 0.2)', lineWidth: 4 });
        chart4.streamTo(document.getElementById("Navio2_airspeed_chart"),  1000);

      };

    $(document).ready(function() {
        MQTTconnect();
    });

    function check_timeout() {
        //Engine_Fuel_Bar.set(0.8);
        //Engine_Throttle_Bar.set(0.2);
        //Wingtip1_Bar_1.set(0.1);
        //Wingtip1_Bar_2.set(0.3);
        //Wingtip2_Bar_1.set(0.5);
        //Wingtip2_Bar_2.set(0.7);
        //Engine_AirFuelMix_Bar.set(0.3);
        //calculate_POT_count();
        navio1_timeout_counter < 5     ? navio1_timeout_counter++     : navio1_timeout_val     = 1;
        navio2_timeout_counter < 5     ? navio2_timeout_counter++     : navio2_timeout_val     = 1;
        gateway_timeout_counter < 5    ? gateway_timeout_counter++    : gateway_timeout_val    = 1;
        winch1_timeout_counter < 5     ? winch1_timeout_counter++     : winch1_timeout_val     = 1;
        winch2_timeout_counter < 5     ? winch2_timeout_counter++     : winch2_timeout_val     = 1;
        winch3_timeout_counter < 5     ? winch3_timeout_counter++     : winch3_timeout_val     = 1;
        forcebar_timeout_counter < 5   ? forcebar_timeout_counter++   : forcebar_timeout_val   = 1;
        engine_timeout_counter < 5     ? engine_timeout_counter++     : engine_timeout_val     = 1;
        camera_timeout_counter < 5     ? camera_timeout_counter++     : camera_timeout_val     = 1;


        if (navio1_timeout_val == 1) {
            idList = ["Navio1_AHRS_Healthy", "Navio1_IMU_Healthy", "Navio1_Airspeed_Healthy",
                "Navio1_Number_of_Satellites", "Navio1_Flight_Mode", "Navio1_Temperature", "Navio1_File_Counter"];
            for (i = 0; i < idList.length; i++) {
                updateText(idList[i], "Timeout", "orange");
            }
    	}
    	if (navio2_timeout_val == 1) {
            idList = ["Navio2_AHRS_Healthy", "Navio2_IMU_Healthy", "Navio2_Airspeed_Healthy",
                "Navio2_Number_of_Satellites", "Navio2_Flight_Mode", "Navio2_Temperature", "Navio2_File_Counter"];
            for (i = 0; i < idList.length; i++) {
                updateText(idList[i], "Timeout", "orange");
            }
    	}
        if (gateway_timeout_val == 1) {
            idList = ["Recording_Status", "Gateway_Status"];
            for (i = 0; i < idList.length; i++) {
                updateText(idList[i], "Timeout", "orange");
            }
    	}
        if (forcebar_timeout_val == 1) {
            idList = ["Force_Bar_GPS_Status", "Force_Bar_OptoForce_1_Status", "Force_Bar_OptoForce_2_Status",
                "Force_Bar_LoadCell_1_Status", "Force_Bar_LoadCell_2_Status", "Force_Bar_LoadCell_3_Status",
                "Force_Bar_LoadCell_4_Status"];
            for (i = 0; i < idList.length; i++) {
                updateText(idList[i], "Timeout", "orange");
            }
    	}
        if (engine_timeout_val == 1) {
            idList = ["Engine_CylinderHead1_Temp", "Engine_CylinderHead2_Temp", "Engine_ExhaustGas1_Temp",
                "Engine_ExhaustGas2_Temp", "Engine_Low_Oil", "Engine_Gps",
                "Engine_Started", "Engine_Voltage", "Engine_Humidity"];
            for (i = 0; i < idList.length; i++) {
                updateText(idList[i], "Timeout", "orange");
            }
    	 }
        if (camera_timeout_val == 1) {
            idList = ["Camera_Status", "Camera_GPS_Status"];
            for (i = 0; i < idList.length; i++) {
                updateText(idList[i], "Timeout", "orange");
            }
    	}
	}

	function openDevice(evt, deviceName) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(deviceName).style.display = "block";
    evt.currentTarget.className += " active";
	}

	function Actuator_Command(actuator_index, test_type , frequency, amplitude, delta_t) {


//uint8_t type
//0: step
//1:doublet
//2:3211
//3:sinusoidal
//4:ramp
//5:hold
//6:neutral
//7:calibrate
//8:pulse
       //   $('#ws').prepend('<li>' + actuator_index + '</li>');
    var Command_to_Send  = {
	  test_type       : test_type,         //uint8
	  frequency       : frequency,         //uint32
	  amplitude       : amplitude,         //int32
	  delta_t         : delta_t            //uint32
	  };

    if(test_type == 18){ //Activate-Deactivate 
    	if(actuator_index == 5){ //Left keelshift
    		if(actuator_state_left > 1){ //Deactivate command must be sent
    			Command_to_Send.amplitude = 0;
    		}
    		else{
    			Command_to_Send.amplitude = 1;
    		}
    	}
    	else if(actuator_index == 6){
    		if(actuator_state_right > 1){ //Deactivate command must be sent
    			Command_to_Send.amplitude = 0;
    		}
    		else{
    			Command_to_Send.amplitude = 1;
    		}
    	}    
    	
    	if(actuator_index == 1){ //Left wingtip
    		if(actuator_state_port > 1){ //Deactivate command must be sent
    			Command_to_Send.amplitude = 0;
    		}
    		else{
    			Command_to_Send.amplitude = 1;
    		}
    	}
    	else if(actuator_index == 2){
    		if(actuator_state_stbd > 1){ //Deactivate command must be sent
    			Command_to_Send.amplitude = 0;
    		}
    		else{
    			Command_to_Send.amplitude = 1;
    		}
    	} 	
    	
    	if(actuator_index == 3){ //Left winch
    		if(actuator_state_leftwinch > 1){ //Deactivate command must be sent
    			Command_to_Send.amplitude = 0;
    		}
    		else{
    			Command_to_Send.amplitude = 1;
    		}
    	}
    	else if(actuator_index == 4){
    		if(actuator_state_rightwinch > 1){ //Deactivate command must be sent
    			Command_to_Send.amplitude = 0;
    		}
    		else{
    			Command_to_Send.amplitude = 1;
    		}
    	}
    	else if(actuator_index == 7){
    		if(actuator_state_pitchwinch > 1){ //Deactivate command must be sent
    			Command_to_Send.amplitude = 0;
    		}
    		else{
    			Command_to_Send.amplitude = 1;
    		}
    	} 	
    }

    if(test_type == 0){  //Step Command
       if(actuator_index == 5){ //Left Keelshift
        	if(amplitude > 0){
        		if(keelshift_left_duty_cycle_inc < MAX_DUTY_CYCLE){
        			keelshift_left_duty_cycle_inc += INCREMENT_DUTY_CYCLE;
        		}				
    			Command_to_Send.amplitude += keelshift_left_duty_cycle_inc;
			}
			else{
				keelshift_left_duty_cycle_inc = 0;
			}          
       }
       if(actuator_index == 6){ //Right Keelshift
        	if(amplitude > 0){
        		if(keelshift_rght_duty_cycle_inc < MAX_DUTY_CYCLE){
        			keelshift_rght_duty_cycle_inc += INCREMENT_DUTY_CYCLE;
        		}				
				Command_to_Send.amplitude += keelshift_rght_duty_cycle_inc;
			}
			else{
				keelshift_rght_duty_cycle_inc = 0;
			}          
       }   
       
       if(actuator_index == 3){ //Left Winch
        	if(amplitude > 0){
        		if(winch_left_duty_cycle_inc < MAX_DUTY_CYCLE){
        			winch_left_duty_cycle_inc += INCREMENT_DUTY_CYCLE;
        		}				
    			Command_to_Send.amplitude += winch_left_duty_cycle_inc;
			}
			else{
				winch_left_duty_cycle_inc = 0;
			}          
       }
       if(actuator_index == 4){ //Right Winch
        	if(amplitude > 0){
        		if(winch_rght_duty_cycle_inc < MAX_DUTY_CYCLE){
        			winch_rght_duty_cycle_inc += INCREMENT_DUTY_CYCLE;
        		}				
				Command_to_Send.amplitude += winch_rght_duty_cycle_inc;
			}
			else{
				winch_rght_duty_cycle_inc = 0;
			}          
       }  
       if(actuator_index == 7){ //Right Winch
        	if(amplitude > 0){
        		if(winch_ptch_duty_cycle_inc < MAX_DUTY_CYCLE){
        			winch_ptch_duty_cycle_inc += INCREMENT_DUTY_CYCLE;
        		}				
				Command_to_Send.amplitude += winch_ptch_duty_cycle_inc;
			}
			else{
				winch_ptch_duty_cycle_inc = 0;
			}          
       }      
    }
    else{
		 keelshift_left_duty_cycle_inc = 0;
       keelshift_rght_duty_cycle_inc = 0;       
       winch_left_duty_cycle_inc = 0;
       winch_rght_duty_cycle_inc = 0;
       winch_ptch_duty_cycle_inc = 0;  
    }  

    var buffer_to_send   = new ArrayBuffer(21);
	 new DataView(buffer_to_send).setUint8 (0, Command_to_Send.test_type,       true /* littleEndian */);
	 new DataView(buffer_to_send).setUint32(1, Command_to_Send.frequency,       true /* littleEndian */);
    new DataView(buffer_to_send).setInt32 (5, Command_to_Send.amplitude,        true /* littleEndian */);
    new DataView(buffer_to_send).setUint32(9, Command_to_Send.delta_t,          true /* littleEndian */);
    new DataView(buffer_to_send).setFloat32(13, pitch_linear_command_deg,       true /* littleEndian */);
    new DataView(buffer_to_send).setFloat32(17, roll_linear_command_deg,        true /* littleEndian */);

    message = new Paho.MQTT.Message(buffer_to_send);
    message.destinationName = "pilotip/Actuator_Command/" + actuator_index;
    mqtt.send(message);

		}

function Maneuver_Command(maneuver_index) {
		
	// 0: No maneuver/ 1:Pitch Up/ 2:Pitch Down/ 3:Bank Left/ 4:Bank Right/ 5:Bank and Dive/ 6:Bank and Climb

    var buffer_to_send   = new ArrayBuffer(2);
    new DataView(buffer_to_send).setUint8 (0, 8,              true /* littleEndian */);
	 new DataView(buffer_to_send).setUint8 (1, Number(maneuver_index), true /* littleEndian */);

    message = new Paho.MQTT.Message(buffer_to_send);
    message.destinationName = "pilotip/Pilot_Command";
    mqtt.send(message);
}		

function Pilot_Control_Command(ind, cmd) {

    var Command_to_Send  = {
	  command_index  : ind,  //uint8
	  command       : cmd,	 //uint8
	  };

    var buffer_to_send   = new ArrayBuffer(2);
	 new DataView(buffer_to_send).setUint8(0, Command_to_Send.command_index,      true /* littleEndian */);
	 new DataView(buffer_to_send).setUint8(1, Command_to_Send.command,           true /* littleEndian */);



        message = new Paho.MQTT.Message(buffer_to_send);
        message.destinationName = "pilotip/Pilot_Command";
        mqtt.send(message);
}

function Camera_Control_Command(ind) {

    var Command_to_Send  = {
	  command_index  : ind,  //uint8
	  };

    var buffer_to_send   = new ArrayBuffer(1);
	 new DataView(buffer_to_send).setUint8(0, Command_to_Send.command_index,      true /* littleEndian */);

        message = new Paho.MQTT.Message(buffer_to_send);
        message.destinationName = "camera/command";
        mqtt.send(message);
}


function Actuator_Selection() {
    var Spring = document.getElementById("Spring");
    var SpringSel = Spring.options[Spring.selectedIndex].value;
    var Position = document.getElementById("Position");
    var PositionSel = Position.options[Position.selectedIndex].value;
    var Speed = document.getElementById("Speed");
    var SpeedSel = Speed.options[Speed.selectedIndex].value;
    document.getElementById("Selection").innerHTML = 'Spring: ' + SpringSel + '/ Pos: ' + PositionSel + '/ Speed: ' + SpeedSel;
    
    Actuator_Command(5, 15 , Spring.selectedIndex, Position.selectedIndex, Speed.selectedIndex);
    Actuator_Command(6, 15 , Spring.selectedIndex, Position.selectedIndex, Speed.selectedIndex);
}

async function main() {
    await sleep(1000);

    //var x = 0;
    //setInterval(function () {
    //    Navio1_Altitude_m_line.append(new Date().getTime(), Math.sin(Math.PI*(x++/100)));
    //}, 10);

    //class="tablinks" onclick="openDevice(event, 'Navio1')"> Navio1

    writeJoystickCanvas = function (x, y) {
        var canvas = document.getElementById('jcanvas');
        
        if (canvas != null) {
            p = 5;
            w = (canvas.width-p)/2;
            h = (canvas.height-p)/2;
            ctx = canvas.getContext('2d');
            canvas.width = canvas.width;
            ctx.fillStyle = '#000000';
            ctx.fillRect(w + (w * x), h + (h * y), 5, 5);
        }
    }
    writeThrottleCanvas = function (x) {
        var canvas = document.getElementById('tcanvas');

        if (canvas != null) {
            h = canvas.height / 2;
            ctx = canvas.getContext('2d');
            canvas.width = canvas.width;
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(0.5, h * (1 + x) + 0.5, canvas.width - 1, canvas.height - h * (1 + x) - 1);
        }
    }
    writeYawCanvas = function (x) {
        var canvas = document.getElementById('ycanvas');
        if (canvas != null) {
            canvas.width = canvas.width;
            cx = (canvas.width) / 2;
            cy = (canvas.height) / 2;
            ctx = canvas.getContext('2d');
            ctx.translate(cx, cy);
            ctx.rotate(Math.PI * x);
            ctx.translate(-cx, -cy);
            ctx.beginPath();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#000000';
            ctx.moveTo(cx, cy + 20);
            ctx.lineTo(cx, cy - 15);
            ctx.lineTo(cx + 5, cy - 10);
            ctx.moveTo(cx, cy - 15);
            ctx.lineTo(cx - 5, cy - 10);
            ctx.stroke();
            ctx.closePath();
        }
    }
    writeHatCanvas = function (L, F) {
        var canvas = document.getElementById('hcanvas');
        if (canvas != null) {
            canvas.width = canvas.width;
            cx = canvas.width / 2;
            cy = canvas.height / 2;
            writeArrow = function (cx, cy, rot, color) {
                ctx = canvas.getContext('2d');
                ctx.beginPath();
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#' + color;
                ctx.translate(cx, cy);
                ctx.rotate(rot);
                ctx.moveTo(5, 0);
                ctx.lineTo(15, -10);
                ctx.lineTo(30, -10);
                ctx.lineTo(30, 10);
                ctx.lineTo(15, 10);
                ctx.lineTo(5, 0);
                ctx.stroke();
                ctx.closePath();
                ctx.translate(-cx, -cy);
            }
            writeArrow(cx, cy, 0, (L === 1 ? 'ff0000' : '000000'));
            writeArrow(cx, cy, Math.PI / 2, (F === -1 ? 'ff0000' : '000000'));
            writeArrow(cx, cy, Math.PI / 2, (L === -1 ? 'ff0000' : '000000'));
            writeArrow(cx, cy, Math.PI / 2, (F === 1 ? 'ff0000' : '000000'));
        }
    }
    websocket = new WebSocket("ws://138.197.140.80/");
    //websocket.binaryType = 'blob';

    websocket.onopen = function (event) {
        websocket.send(JSON.stringify({ 'CON': 1 }));
    }

    websocket.onmessage = function (event) {
        if (event.data.text) {
            const promisedData = event.data.text();
            promisedData
                .then(function (successMessage) {
                    const message = tryParseJSON(successMessage);
                    if (!message) {
                        console.log('Text unable to be read as JSON');
                    } else {
                        console.log('Received a JSON message');
                        updateVisualObjects(message);
                    }
                }, function (errMessage) {
                    console.log('Error on ws: ' + errMessage);
                })
        } else {
            var message = tryParseJSON(event.data);
            if (!message) {
                try {
                    reader = new FileReader();
                    reader.addEventListener('loadend', (e) => {
                        const text = e.srcElement.result;
                        const jsonMessage = tryParseJSON(text.split(' ').join(''));
                        if (!jsonMessage) {
                            console.log('Text unable to be read as JSON');
                        } else {
                            updateVisualObjects(jsonMessage);
                        }
                    });
                    reader.readAsText(event.data);
                } catch (err) {
                    console.log('Object unable to be read as text');
                    console.log(err);
                }
            } else if (isEmpty(message)) {
                //pass
            } else if ('CONNACK' in message && message['CONNACK']) {
                createJoystickTab();
                createSignInTab();
                createMapTab();
            } else if ('signInResponse' in message) {
                signInResponse(message.signInResponse);
            } else if ('logResponse' in message) {
                logResponse(message.logResponse);
            } else {
                updateVisualObjects(message);
            }
        }
    };
}

main();

function logResponse(res) {
    var byteArray = new Uint8Array(res.data);
    var unzipped = pako.inflate(byteArray, { to: 'string' });
    writeLogs(unzipped);
}

function signInResponse(res) {
    if (isEmpty(res)) {
        alert('No logs found');
    } else if (typeof (res) === 'object' && 'sessionId' in res && 'files' in res) {
        sessionId = res.sessionId;
        removeElement('passwordText', 'usernameText', 'signInButton');
        const logDiv = createElement('div', 'Logs', {
            'id': 'logDiv'
        });
        createElement('text', logDiv, {
            'text': 'yyyy-mm-dd-log[.gz if zipped] [Size] (Size Warning Severity)',
            'break': true
        });
        for (log in res.files) {
            var size = res.fileSizes[log];
            var sev = Math.log(size) / Math.log(4) - (res.files[log].endsWith('.gz') ? 6 : 8); //one exclaimation mark for each power of four above 65536 bytes, +2 if zipped 
            createElement('a', 'logDiv', {
                'text': res.files[log] + ' [' + size + '] ' + (sev >= 1 ? ('(' + '!'.repeat(sev) + ')') : ''),
                'style': 'color: blue; cursor: pointer; cursor: hand;',
                'class': 'logLink',
                'onclick': 'logOnClick("' + res.files[log] + '")',
                'break': true
            });
        }
        createElement('div', 'Logs', { 'id': 'loggingDiv' });
    } else {
        alert(res);
    }
}

function createSignInTab() {
    createElement('button', 'tabs', {
        'class': 'tablinks',
        'onclick': 'openDevice(event, "Logs")',
        'text': 'Logs'
    });
    createElement('div', 'body', {
        'id': 'Logs',
        'class': 'tabcontent'
    });
    createElement('input', 'Logs', {
        'id': 'usernameText',
        'placeholder': 'Username'
    });
    createElement('input', 'Logs', {
        'id': 'passwordText',
        'placeholder': 'Password',
        'type': 'Password'
    });
    createElement('button', 'Logs', {
        'id': 'signInButton',
        'onclick': 'onSignInClick()',
        'text': 'Sign In'
    });
    /*
    var button = document.createElement('button');
    button.setAttribute('class', 'tablinks');
    button.setAttribute('onclick', 'openDevice(event, "Logs")');
    var node = document.createTextNode('Logs');
    button.appendChild(node);
    document.getElementById('tabs').appendChild(button);

    var div = document.createElement('div');
    div.setAttribute('id', 'Logs');
    div.setAttribute('class', 'tabcontent');
    document.body.appendChild(div);

    var userInput = document.createElement('input');
    userInput.setAttribute('id', 'usernameText');
    userInput.setAttribute('placeholder', 'Username');
    var passInput = document.createElement('input');
    passInput.setAttribute('id', 'passwordText');
    passInput.setAttribute('type', 'Password');
    passInput.setAttribute('placeholder', 'Password');
    var signButton = document.createElement('button');
    signButton.setAttribute('id', 'signInButton');
    signButton.setAttribute('onclick', 'onSignInClick()');
    var node = document.createTextNode('Sign In');
    signButton.appendChild(node);
    document.getElementById('Logs').appendChild(userInput);
    document.getElementById('Logs').appendChild(passInput);
    document.getElementById('Logs').appendChild(signButton);
    //*/
}

function createJoystickTab() {
    createElement('button', 'tabs', {
        'class': 'tablinks',
        'onclick': 'openDevice(event, "Joystick")',
        'text': 'Joystick'
    });
    createElement('div', 'body', {
        'id': 'Joystick',
        'class': 'tabcontent'
    });
    makeButton = function (id, i) {
        const div = createElement('div', 'Joystick', {
            'id': id,
            'style': 'position:absolute; top:' + (325 + 75 * Math.floor((i - 1) / 6)) + 'px; left:' + (50 + ((i - 1) % 6) * 150) + 'px; z-index:2'
        });
        const para = createElement('p', div);
        const label = createElement('label', para, {
            'for': id,
            'break': true
        });
        const center = createElement('center', label);
        createElement('font', center, {
            'text': id
        });

        createElement('input', para, {
            'type': 'text',
            'style': 'text-align:center; font-size:10px; background-color:white',
            'id': 'text' + id,
            'value': 'NO DATA',
            'readonly': true
        });
    }
    for (i = 1; i < 13; i++) {
        makeButton('button' + i.toString(), i)
    }
    makeButton('leftright_cmd', 13);
    makeButton('fwdback_cmd', 14);
    makeButton('leftrighthat_cmd', 19);
    makeButton('fwdbackhat_cmd', 20);
    makeButton('yaw_cmd', 25);
    makeButton('thrust_cmd', 26);

    createElement('canvas', 'Joystick', {
        'id': 'tcanvas',
        'width': 25,
        'height': 200,
        'style': 'position:absolute; top:' + 500 + 'px; left:' + 350 + 'px; z-index:2; border: 1px solid black'
    });
    createElement('canvas', 'Joystick', {
        'id': 'jcanvas',
        'width': 200,
        'height': 200,
        'style': 'position:absolute; top:' + 500 + 'px; left:' + 400 + 'px; z-index:2; border: 1px solid black'
    });
    createElement('canvas', 'Joystick', {
        'id': 'ycanvas',
        'width': 87.5,
        'height': 87.5,
        'style': 'position:absolute; top:' + 500 + 'px; left:' + 625 + 'px; z-index:2; border: 1px solid black'
    });
    createElement('canvas', 'Joystick', {
        'id': 'hcanvas',
        'width': 87.5,
        'height': 87.5,
        'style': 'position:absolute; top:' + 612.5 + 'px; left:' + 625 + 'px; z-index:2; border: 1px solid black'
    });
}

function createMapTab() {
    createElement('button', 'tabs', {
        'text': 'Map',
        'class': 'tablinks',
        'onclick': 'openDevice(event, "mapTabBody"); uavMap.invalidateSize();'
    });
    createElement('div', 'body', {
        'id': 'mapTabBody',
        'class': 'tabcontent'
    });
    createElement('div', 'mapTabBody', {
        'id': 'mapDiv',
        'style': 'height: 600px;'
    });
    uavMap = L.map('mapDiv', {
        center: [45.425, -75.7],
        zoom: 12
    });
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
            '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox/streets-v11',
        accessToken: 'pk.eyJ1IjoiamR1ZnIwODYiLCJhIjoiY2szcThtYzl2MDhsZzNjbWtkeG0zams3MyJ9.3GzNTe3kHfIfvPTxd_4TyA'
    }).addTo(uavMap);

    var marker = L.marker([45.425, -75.7]).addTo(uavMap);
    marker.bindPopup('Example Popup<br>Could be used for identifying multiple UAVs');

    uavMap.on('click', e => {
        L.popup()
            .setLatLng(e.latlng)
            .setContent(e.latlng.lat.toFixed(4) + ', ' + e.latlng.lng.toFixed(4))
            .openOn(uavMap);
        console.log(e)
    });
}

function onSignInClick() {
    var usernameToSend = document.getElementById('usernameText').value;
    var passwordToSend = document.getElementById('passwordText').value;
    websocket.send(JSON.stringify({ 'username': usernameToSend, 'password': passwordToSend }));
}

/**
 * Method for buttons to retreive logs from the server.
 * 
 * @param {String} path Path of log file to retreive
 */
function logOnClick(path) {
    websocket.send(JSON.stringify({
        'logRequest': {
            'sessionId': sessionId,
            'path': path
        }
    }));
}

/**
 * Writes results of log retreival to log tab.
 * 
 * @param {String} text Text to write on screen
 */
function writeLogs(text) {
    if (text === 'Incorrect Login') {
        console.log('Incorrect Login');
    } else if (text === '') {
        console.log('No logs found');
    } else {
        var parent = document.getElementById('Logs');
        var div = document.getElementById('loggingDiv');
        while (div.firstChild && div.removeChild(div.firstChild));
        var textArr = text.split('\n');
        for (var i in textArr) {
            div.appendChild(document.createElement('br'));
            div.appendChild(document.createTextNode(textArr[i]));
        }
    }
}

/**
 * Creates the specified element with optional attributes and attaches it to the parent element.
 * 
 * @param {String}          eType   String of element type ('button', 'div', 'br', etc.)
 * @param {(Object|String)} parent  ID or reference of parent element to attach to
 * @param {Object}          options JSON object with key-value pairs of attributes to set
 * @return {Object}                 Element just created
 */
function createElement(eType, parent, options = {}) {
    const keywords = ['text', 'break'];
    const keys = Object.keys(options);
    parent = (typeof (parent) === 'string') ? document.getElementById(parent) : parent;
    let element = document.createElement(eType);
    keys.forEach(key => {
        if (!(key in keywords)) {
            element.setAttribute(key, options[key])
        }
    });
    parent.appendChild(element);
    if ('text' in options) {
        element.appendChild(document.createTextNode(options['text']));
    }
    if ('break' in options && options['break']) {
        parent.appendChild(document.createElement('br'));
    }
    
    return element;
}

/**
 * Removes any number of elements from the document based on given IDs.
 * 
 * @param {String} elementId Element to remove
 * @param {...String} args   Other elements to remove
 */
function removeElement(...args) {
    args.forEach(e => document.getElementById(e).parentNode.removeChild(document.getElementById(e)));
}

/**
 * Updates textboxes on website.
 * 
 * @param {any} id    Element ID to update
 * @param {any} text  New text to display
 * @param {any} color Background color of textbox
 */
function updateText(id, text, color) {
    try {
        inputVal = document.getElementById(id);
        if (typeof text !== "undefined") { inputVal.value = text; }
        if (typeof color !== "undefined") { inputVal.style.backgroundColor = color; }
    }
    catch (e) {
        console.log(e);
        console.log("Failed to retrieve element: " + id);
    }
}

function isEmpty(obj) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            return false;
        }
    }

    return JSON.stringify(obj) === JSON.stringify({});
}

function tryParseJSON(jsonString) {
    try {
        var o = JSON.parse(jsonString);
        if (o && typeof o === "object") {
            return o;
        }
    }
    catch (e) { }
    return false;
}

function updateVisualObjects(json) {
    if ('leftright_cmd' in json && 'fwdback_cmd' in json) {
        writeJoystickCanvas(json['leftright_cmd'], json['fwdback_cmd']);
    }
    if ('thrust_cmd' in json) {
        writeThrottleCanvas(json['thrust_cmd']);
    }
    if ('yaw_cmd' in json) {
        writeYawCanvas(json['yaw_cmd']);
    }
    if ('leftrighthat_cmd' in json && 'fwdbackhat_cmd' in json) {
        writeHatCanvas(json['leftrighthat_cmd'], json['fwdbackhat_cmd']);
    }

    for (let key in json) {
        let value = json[key];
        switch (key) {
            case 'CONNACK':
                console.log('Connection Established');
                break;
            case 'topic':
                if (value === 'navio1/message') {
                    navio1_timeout_counter = 0;
                    navio1_timeout_val = 0;
                } else if (value === 'navio2/message') {
                    navio2_timeout_counter = 0;
                    navio2_timeout_val = 0;
                } else if (value === 'engine/message') {
                    engine_timeout_counter = 0;
                    engine_timeout_val = 0;
                }
                break;
            case 'pitch_deg':
                Navio1_attitude.setPitch(value);
                break;
            case 'roll_deg':
                Navio1_attitude.setRoll(value);
                break;
            case 'yaw_deg':
                Navio1_heading.setHeading(value);
                break;
            case 'altitude_m':
                Navio1_Altitude_m_line.append(new Date().getTime(), value);
                break;
            case 'IMU_Healthy':
                updateText("Navio1_IMU_Healthy", value ? "Healthy" : "Failed", value ? "green" : "red");
                break;
            case 'throttle_cmd':
                Navio1_Throttle_Bar.set(value / 100);
                break;
            case 'GPS_numofsat':
                updateText("Navio1_Number_of_Satellites", value);
                break;
            case 'AHRS_Healthy':
                updateText("Navio1_AHRS_Healthy", value ? "Healthy" : "Failed", value ? "green" : "red");
                break;
            case 'file_counter':
                updateText("Navio1_File_Counter", "Number of Files: " + value, "green");
                break;
            case 'airspeed_mps':
                Navio1_Airspeed_mps_line.append(new Date().getTime(), value);
                break;
            case 'temp_C':
                updateText("Navio1_Temperature", value + "\u00B0C");
                break;
            case 'Airspeed_Healthy':
                updateText("Navio1_Airspeed_Healthy", value ? "Healthy" : "Failed", value ? "green" : "red");
                break;
            case 'flight_mode':
                updateText("Navio1_Flight_Mode", value);
                break;
            case 'low_oil':
                updateText('Engine_Low_Oil', value ? 'Low' : 'Healthy', value ? 'red' : 'green');
                break;
            //case 'aux_pump':
            //    updateText('Engine_AuxPump', value ? 'On' : 'Off', value ? 'green' : 'red');
            //    break;
            case 'gps_status':
                updateText('Engine_Gps', value ? 'Healthy' : 'Failed', value ? 'green' : 'red');
                break;
            case 'starter_led':
                updateText('Engine_Started', value ? 'Running' : 'Stopped', value ? 'green' : 'red');
                break;
            //case 'inlet_temp':
            //    updateText('Engine_Inlet_Temp', value, value ? 'green' : 'red');
            //    break;
            //case 'gearbox_temp':
            //    updateText('Engine_Gearbox_Temp', value, value ? 'green' : 'red');
            //    break;
            case 'CHT1':
                updateText('Engine_CylinderHead1_Temp', value, value ? 'green' : 'red');
                barVal = ((value - 150) / 100);
                CHT_1_Bar.set((0 < barVal && barVal < 1) ? barVal : ((barVal > 1) ? 1 : 0));
                break;
            case 'CHT2':
                updateText('Engine_CylinderHead2_Temp', value, value ? 'green' : 'red');
                barVal = ((value - 150) / 100);
                CHT_2_Bar.set((0 < barVal && barVal < 1) ? barVal : ((barVal > 1) ? 1 : 0));
                break;
            //case 'carburetor_temp_1':
            //    updateText('Engine_Carburetor1_Temp', value, value ? 'green' : 'red');
            //    break;
            //case 'carburetor_temp_2':
            //    updateText('Engine_Carburetor2_Temp', value, value ? 'green' : 'red');
            //    break;
            case 'EGT1':
                updateText('Engine_ExhaustGas1_Temp', value, value ? 'green' : 'red');
                break;
            case 'EGT2':
                updateText('Engine_ExhaustGas2_Temp', value, value ? 'green' : 'red');
                break;
            case 'system_voltage':
                updateText('Engine_Voltage', value, value ? 'green' : 'red');
                break;
            case 'humidity':
                updateText('Engine_Humidity', value, value ? 'green' : 'red');
                break;
            //case 'manifold_pressure_1':
            //    updateText('Engine_Manifold1_Pressure', value, value ? 'green' : 'red');
            //    break;
            //case 'manifold_pressure_2':
            //    updateText('Engine_Manifold2_Pressure', value, value ? 'green' : 'red');
            //    break;
            case 'output_rpm':
                Engine_rpm.setAirSpeed((value * 160) / 8000);
                break;
            case 'fuel_level':
                Engine_Fuel_Bar.set(value / 100);
                break;
            case 'throttle':
                Engine_Throttle_Bar.set(value / 100);
                break;
            case 'AFR':
                Engine_AirFuelMix_Bar.set(value / 100);
                break;
        }
        for (let key in json) {
            if (document.getElementById('text' + key.toString()) == null) {
                continue;
            }
            val = json[key.toString()];
            document.getElementById('text' + key.toString()).value = val;
            document.getElementById('text' + key.toString()).style.backgroundColor = (val === 0 ? 'white' : 'orange');
            //console.log(key);
        }
    }
}