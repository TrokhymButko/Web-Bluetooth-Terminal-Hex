// UI elements.
const deviceNameLabel = document.getElementById('device-name');
const connectButton = document.getElementById('connect');
const disconnectButton = document.getElementById('disconnect');
const terminalContainer = document.getElementById('terminal');
const sendForm = document.getElementById('send-form');
const inputField = document.getElementById('input');

// Helpers.
const defaultDeviceName = 'Terminal';
const terminalAutoScrollingLimit = terminalContainer.offsetHeight / 2;
let isTerminalAutoScrolling = true;

const scrollElement = (element) => {
  const scrollTop = element.scrollHeight - element.offsetHeight;

  if (scrollTop > 0) {
    element.scrollTop = scrollTop;
  }
};

const logToTerminal = (message, type = '') => {
  terminalContainer.insertAdjacentHTML('beforeend',
      `<div${type && ` class="${type}"`}>${message}</div>`);

  if (isTerminalAutoScrolling) {
    scrollElement(terminalContainer);
  }
};

const logToTerminalBin = (message, type = '') => {
  let stringElement = document.getElementById(type);
  stringElement.innerHTML = message
};



// Obtain configured instance.
const terminal = new BluetoothTerminal();

    
twoByteToInt = function (data) {
  if (data > 32767) {
  return (data - 65536);
  } else {
  return data  
  }
}

function convertToHex(str) {
  var hex = '';
  for(var i=0;i<str.length;i++) {
      hex += ''+str.charCodeAt(i).toString(16);
  }
  return hex;
}

arToHex = function (arrByte) {
  let strHex = ""
  let char = ""
  let strChar = ""
  
  for (let index = 0; index < arrByte.length; index++) {
        strHex += ("0" + arrByte[index].toString(16) +",").substr(-3, 3).toUpperCase() ;
         if (arrByte[index]<33 || arrByte[index]>126) { 
          char = "." ;
          } else {
            char = String.fromCharCode(arrByte[index]);
            if (char.length != 1) { char = "." }; 
          }
         
         strChar += char;
    }

  return strHex + " | " + strChar
  }


// Override `receive` method to log incoming data to the terminal.
terminal.receive = function(data) {
  
  logToTerminal(data, 'in');
  // console.log(convertToHex(data));
  // console.log(typeof data );
};

let dist=0
let energy=0
terminal.receiveBin = function(data) {
  let inId = ""
  let dataBin = ""
  if (!(data[0]==85 && data[1]==170 && data[19]==0)) {
    return
  }
  let current = twoByteToInt(data[10] * 256 + data[11])/100
  dataBin = ("Cur = " + current.toFixed(2) + "A; <br>")
  logToTerminalBin(dataBin,"stroke1el1");
  
  let voltage = twoByteToInt(data[2] * 256 + data[3])/100
  dataBin = ("V = " + voltage.toFixed(2) + "v; <br>")
  logToTerminalBin(dataBin,"stroke1el2");
  
  let speed = twoByteToInt(data[4] * 256 + data[5])/100
  dataBin = ("Sped = " + speed.toFixed(2) + "km/h; <br>")
  logToTerminalBin(dataBin,"stroke1el3");
   
  dist += speed
  dataBin = ("Dist = " + (dist/10000).toFixed(3) + "km; <br>")
  logToTerminalBin(dataBin,"stroke1el4");
  
  let temperature = twoByteToInt(data[12] * 256 + data[13])/100
  dataBin = ("t°C = " + temperature.toFixed(2) + "°C; <br>")
  logToTerminalBin(dataBin,"stroke1el5");
  
  let power = voltage * current
  dataBin = ("Power = " + (power/1000).toFixed(3) +"kWt;<br> ")
  logToTerminalBin(dataBin,"stroke2el1");
  
  energy += power
  dataBin = ("Energy = " + (energy/10000000).toFixed(3) + "kW/h; <br>")
  logToTerminalBin(dataBin,"stroke2el2");
  
  efficiency = power / speed
  dataBin = ("Eff..y = " + (efficiency).toFixed(3) + "Wh/km; <br>")
  logToTerminalBin(dataBin,"stroke2el3");
  
};
// Override default log method to output messages to the terminal and console.
terminal._log = function(...messages) {
  // We can't use `super._log()` here.
  messages.forEach((message) => {
    logToTerminal(message);
    console.log(message); // eslint-disable-line no-console
  });
};

// Implement own send function to log outcoming data to the terminal.
const send = (data) => {
  terminal.send(data).
      then(() => logToTerminal(data, 'out')).
      catch((error) => logToTerminal(error));
};

// Bind event listeners to the UI elements.
connectButton.addEventListener('click', () => {
  terminal.connect().
      then(() => {
        deviceNameLabel.textContent = terminal.getDeviceName() ?
            terminal.getDeviceName() : defaultDeviceName;
      });
});

disconnectButton.addEventListener('click', () => {
  terminal.disconnect();
  deviceNameLabel.textContent = defaultDeviceName;
});

sendForm.addEventListener('submit', (event) => {
  event.preventDefault();

  send(inputField.value);

  inputField.value = '';
  inputField.focus();
});

// Switch terminal auto scrolling if it scrolls out of bottom.
terminalContainer.addEventListener('scroll', () => {
  const scrollTopOffset = terminalContainer.scrollHeight -
      terminalContainer.offsetHeight - terminalAutoScrollingLimit;

  isTerminalAutoScrolling = (scrollTopOffset < terminalContainer.scrollTop);
});
