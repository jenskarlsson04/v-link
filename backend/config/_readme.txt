//////////////////////////////////////////////////////////////////////////////////////////
/*                                                                                      */
/*  Message Format:                                                                     */
/*  000FFFFE FF FF FF FF FF FF FF FF                                                    */
/*     |     |  |  |  |  |  |  '--'---- Padding                                         */
/*     |     |  |  |  |  |  '---------- Number of responses expected (query only)       */
/*     |     |  |  |  |  |                                                              */
/*     |     |  |  |  '--'------------- Parameter                                       */
/*     |     |  |  '------------------- Command                                         */
/*     |     |  '---------------------- Target ECU address                              */
/*     |     '------------------------- Message-length (always C8 + data byte length)   */
/*     '------------------------------- Module ID                                       */
/*                                                                                      */
//////////////////////////////////////////////////////////////////////////////////////////


//  Template:
//
//  "boost": {
//      /* CAN-Bus parameter:
//      interface: "can0",                  // CAN bus interface
//      parameter: ['12', '9D'],            // Request parameter
//      app_id: "map:",                     // Internal identifier for V-Link app
//      req_id: req_id[0],                  // ID for the request message
//      rep_id: rep_id[0],                  // ID for the expected reply
//      action: command[3],                 // Type of operation
//      target: target_id[0],               // Target ECU
//      is_16bit: false,                    // 8Bit or 16Bit response value
//      refresh_rate: 0.02,                 // How much time to wait to send message again (seconds)
//      scale: '((value - 101.0) * 0.01)',  // Formula to scale the response
//      //UI parameter:
//      label: "Boost",                     // Label for V-Link app
//      max_value: 2,                       // Expected max. value for gauge setup
//      limit_start: 1.5,                   // Start of redline for gauge setup
//  },

//  Broadcast example:
//  "rpm_broadcast": {
//      interface: "can1",
//      type: "broadcast",                 // Read value from incoming frame
//      rep_id: rep_id[0],                  // ID of the broadcast message
//      data_bytes: [1, 6],                 // Byte indices containing the value
//      is_16bit: true,
//      scale: '(value * 1)'
//  }

//  Live sensor example:
//  "rpm": {
//      interface: "can2",
//      rep_id: rep_id[0],                  // ID of the live message
//      data_bytes: [6, 7],                 // Byte indices containing the value
//      is_16bit: true,
//      scale: '(value * 1)'
//  }