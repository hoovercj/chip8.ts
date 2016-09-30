/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var chip8_1 = __webpack_require__(1);
	var chip8;
	var buffer;
	var keys = [];
	var emulationLoop;
	var delay = 0;
	function setDelay(newDelay) {
	    delay = newDelay;
	}
	function startEmulation() {
	    console.log('Start Emulation');
	    chip8 = new chip8_1.Chip8();
	    chip8.loadRom(buffer);
	    tickEmulation();
	    animate();
	}
	function animate() {
	    drawCanvas();
	    requestAnimationFrame(animate);
	}
	function stopEmulation() {
	    console.log('Stop emulation');
	    clearInterval(emulationLoop);
	}
	function tickEmulation() {
	    console.log('Tick emulation');
	    chip8.setKeys(keys);
	    chip8.emulateCycle();
	    emulationLoop = setTimeout(tickEmulation, delay);
	}
	function setupInput() {
	    console.log('Setup input');
	    keys = [];
	    window.onkeydown = function (e) {
	        e = e || window.event;
	        var key = keymap[String.fromCharCode(e.which).toUpperCase()];
	        keys[key] = true;
	        console.log("Key down: " + e.key);
	    };
	    window.onkeyup = function (e) {
	        e = e || window.event;
	        var key = keymap[String.fromCharCode(e.which).toUpperCase()];
	        keys[key] = false;
	        console.log("Key up: " + e.key);
	    };
	}
	function setupFileReader() {
	    var fileInput = document.getElementById('fileInput');
	    fileInput.addEventListener('change', function (e) {
	        console.log('File selected');
	        var file = fileInput.files[0];
	        var reader = new FileReader();
	        reader.onloadend = function (e) {
	            console.log('File loaded');
	            buffer = reader.result;
	            stopEmulation();
	            startEmulation();
	        };
	        reader.readAsArrayBuffer(file);
	    });
	}
	function setupRomSelector() {
	    var selectInput = document.getElementById('romSelector');
	    selectInput.addEventListener('change', function (e) {
	        loadRom(selectInput.value);
	    });
	}
	function loadRom(name) {
	    var request = new XMLHttpRequest;
	    request.onload = function () {
	        if (request.response) {
	            buffer = new Uint8Array(request.response);
	            stopEmulation();
	            startEmulation();
	        }
	    };
	    request.open("GET", "roms/" + name, true);
	    request.responseType = "arraybuffer";
	    request.send();
	}
	var canvas;
	var canvasContext;
	var canvasContainer;
	function setupGraphics() {
	    canvasContainer = document.getElementById('canvasContainer');
	    canvas = document.getElementById('chip8Canvas'); // in your HTML this element appears as <canvas id="mycanvas"></canvas>
	    canvasContext = canvas.getContext('2d');
	    setCanvasSize();
	    window.addEventListener('resize', setCanvasSize);
	}
	function setCanvasSize() {
	    canvas.width = canvasContainer.clientWidth;
	    canvas.height = canvasContainer.clientHeight;
	}
	function drawCanvas() {
	    // TODO: offscreen canvas?
	    var scaleFactor = getScaleFactor();
	    canvasContext.fillRect(0, 0, canvasContainer.clientWidth, canvasContainer.clientHeight);
	    console.log('Draw graphics');
	    chip8.Display.forEach(function (row, rowIndex) {
	        row.forEach(function (column, columnIndex) {
	            if (column) {
	                canvasContext.clearRect(columnIndex * scaleFactor, rowIndex * scaleFactor, scaleFactor, scaleFactor);
	            }
	        });
	    });
	}
	function getScaleFactor() {
	    return canvasContainer.clientWidth / 64;
	}
	window.onload = function () {
	    console.log('window.onload');
	    setupInput();
	    setupFileReader();
	    setupRomSelector();
	    setupGraphics();
	};
	var keymap = {
	    "1": 0x1,
	    "2": 0x2,
	    "3": 0x3,
	    "4": 0xC,
	    "Q": 0x4,
	    "W": 0x5,
	    "E": 0x6,
	    "R": 0xD,
	    "A": 0x7,
	    "S": 0x8,
	    "D": 0x9,
	    "F": 0xE,
	    "Z": 0xA,
	    "X": 0x0,
	    "C": 0xB,
	    "V": 0xF
	};


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var Chip8Spec_1 = __webpack_require__(2);
	var Chip8 = (function () {
	    function Chip8() {
	        this.initialize();
	    }
	    Chip8.prototype.setKeys = function (keys) {
	        this.Keys = keys;
	    };
	    Chip8.prototype.initialize = function () {
	        // Initialize registers and memory once
	        this.ProgramCounter = 0x200; // Program counter starts at 0x200
	        this.Opcode = 0; // Reset current opcode
	        this.I = 0; // Reset index register
	        // Clear display
	        this.initializeDisplay();
	        // Clear stack
	        this.Stack = [];
	        // Clear registers V0-VF
	        this.V = new Uint8Array(16);
	        // Clear memory
	        this.Memory = new Uint8Array(4096);
	        // Load fontset
	        for (var i = 0; i < Chip8Spec_1.Chip8Spec.FONTSET.length; i++) {
	            this.Memory[80 + i] = Chip8Spec_1.Chip8Spec.FONTSET[i];
	        }
	        // Clear timers
	        this.SoundTimer = 0;
	        this.DelayTimer = 0;
	    };
	    Chip8.prototype.loadRom = function (buffer) {
	        var bufferView = new Uint8Array(buffer);
	        // console.log(`Loading ${buffer.byteLength} buffer into emulator`);
	        for (var i = 0; i < bufferView.length; i++) {
	            this.Memory[Chip8Spec_1.Chip8Spec.PC_START + i] = bufferView[i];
	        }
	    };
	    // Fetch Opcode
	    // Decode Opcode
	    // Execute Opcode
	    Chip8.prototype.emulateCycle = function () {
	        // console.group('Emulate Cycle');
	        this.setOpcodeFromMemory();
	        //console.log(`ProgramCounter: ${this.programCounter}`);
	        //console.log(`Opcode: ${this.opcode.toString(16)}`);
	        this.performOpcode();
	        this.updateTimers();
	    };
	    Chip8.prototype.performOpcode = function () {
	        var _this = this;
	        this.unpackOpcode();
	        if (!this.AwaitingKey) {
	            this.ProgramCounter += 2;
	        }
	        else {
	        }
	        // Decode opcode
	        switch (this.Opcode & 0xF000) {
	            // Some opcodes //
	            case 0x0000:
	                switch (this.Opcode & 0x000F) {
	                    case 0x0000:
	                        //console.log('// 0x00E0: Clears the screen.');
	                        this.initializeDisplay();
	                        break;
	                    case 0x000E:
	                        // The interpreter sets the program counter to the address at the top of the stack, then subtracts 1 from the stack pointer.
	                        //console.log('0x00EE: Returns from subroutine.');
	                        if (this.Stack.length > 0) {
	                            this.ProgramCounter = this.Stack.pop();
	                        }
	                        else {
	                            throw new Error('Attempting to pop an empty stack.');
	                        }
	                        break;
	                    default:
	                        console.error("Unknown opcode [0x0000]: 0x%X\n", this.Opcode);
	                        break;
	                }
	                break;
	            case 0x1000:
	                // The interpreter sets the program counter to nnn.
	                //console.log(`1NNN: Jump to location ${this.NNN}.`);
	                this.ProgramCounter = this.getNNN();
	                break;
	            case 0x2000:
	                // The interpreter increments the stack pointer, then puts the current PC on the top of the stack. The PC is then set to nnn.
	                //console.log(`2NNN: Call subroutine at ${this.NNN}.`);
	                this.Stack.push(this.ProgramCounter);
	                this.ProgramCounter = this.getNNN();
	                break;
	            case 0x3000:
	                //The interpreter compares register Vx to kk, and if they are equal, increments the program counter by 2.
	                console.log("3XKK: Skip next instruction if Vx = kk.");
	                console.log(this.V[this.X] + " == " + this.KK);
	                if (this.V[this.X] == this.KK) {
	                    this.ProgramCounter += 2;
	                }
	                break;
	            case 0x4000:
	                // The interpreter compares register Vx to kk, and if they are not equal, increments the program counter by 2.
	                //console.log(`4XKK: Skip next instruction if Vx != kk.`);
	                //console.log(`${this.V[this.X]} != ${this.KK}`)
	                if (this.V[this.X] != this.KK) {
	                    this.ProgramCounter += 2;
	                }
	                break;
	            case 0x5000:
	                // The interpreter compares register Vx to register Vy, and if they are equal, increments the program counter by 2.
	                //console.log(`5xy0: Skip next instruction if Vx = Vy.`);
	                //console.log(`${this.V[this.X]} == ${this.V[this.Y]}`);
	                if (this.V[this.X] == this.V[this.Y]) {
	                    this.ProgramCounter += 2;
	                }
	                break;
	            case 0x6000:
	                // The interpreter puts the value kk into register Vx.
	                //console.log('6xkk: Set Vx = kk.');
	                //console.log(`V${this.X} = ${this.KK}`);
	                this.V[this.X] = this.KK;
	                break;
	            case 0x7000:
	                // Adds the value kk to the value of register Vx, then stores the result in Vx.
	                //console.log('7xkk: Set Vx = Vx + kk.');
	                //console.log(`V${this.X} = ${this.V[this.X]} + ${this.KK} = ${this.V[this.X] + this.KK}`);
	                this.V[this.X] += this.KK & 0x00FF;
	                break;
	            case 0x8000:
	                switch (this.Opcode & 0x00F) {
	                    case 0x0000:
	                        // Stores the value of register Vy in register Vx.
	                        //console.log('8XY0: Set Vx = Vy.');
	                        //console.log(`V${this.X} = V${this.Y} = ${this.V[this.Y]}`);
	                        this.V[this.X] = this.V[this.Y];
	                        break;
	                    case 0x0001:
	                        // Performs a bitwise OR on the values of Vx and Vy, then stores the result in Vx. A bitwise OR compares the corrseponding bits from two values, and if either bit is 1, then the same bit in the result is also 1. Otherwise, it is 0.
	                        //console.log('8XY1: Set Vx = Vx OR Vy.');
	                        //console.log(`V${this.X} = ${this.V[this.X]} OR ${this.V[this.Y]} = ${this.V[this.X] | this.V[this.Y]}`);
	                        this.V[this.X] |= this.V[this.Y];
	                        break;
	                    case 0x0002:
	                        // Performs a bitwise AND on the values of Vx and Vy, then stores the result in Vx. A bitwise AND compares the corrseponding bits from two values, and if both bits are 1, then the same bit in the result is also 1. Otherwise, it is 0.
	                        //console.log('8XY2: Set Vx = Vx AND Vy.');
	                        //console.log(`V${this.X} = ${this.V[this.X]} | ${this.V[this.Y]} = ${this.V[this.X] | this.V[this.Y]}`)
	                        this.V[this.X] &= this.V[this.Y];
	                        break;
	                    case 0x0003:
	                        // Performs a bitwise exclusive OR on the values of Vx and Vy, then stores the result in Vx. An exclusive OR compares the corrseponding bits from two values, and if the bits are not both the same, then the corresponding bit in the result is set to 1. Otherwise, it is 0. 
	                        //console.log('8XY3: Set Vx = Vx XOR Vy.');
	                        //console.log(`V${this.X} = ${this.V[this.X]} ^ ${this.V[this.Y]} = ${this.V[this.X] ^ this.V[this.Y]}`)
	                        this.V[this.X] ^= this.V[this.Y];
	                        break;
	                    case 0x0004:
	                        // The values of Vx and Vy are added together. If the result is greater than 8 bits (i.e., > 255,) VF is set to 1, otherwise 0. Only the lowest 8 bits of the result are kept, and stored in Vx.
	                        //console.log('8XY4: Set Vx = Vx + Vy, set VF = carry.');
	                        //console.log(`V${this.X} = ${this.V[this.X]} + ${this.V[this.Y]} = ${this.V[this.X] + this.V[this.Y]}`);
	                        var intermediate = this.V[this.X] + this.V[this.Y];
	                        this.V[0xF] = intermediate > 0xFF ? 1 : 0;
	                        this.V[this.X] = intermediate & 0xFF;
	                        break;
	                    case 0x0005:
	                        // If Vx > Vy, then VF is set to 1, otherwise 0. Then Vy is subtracted from Vx, and the results stored in Vx.
	                        // console.log('8XY5: Set Vx = Vx - Vy, set VF = NOT borrow.');
	                        // console.log(`V${this.X} = ${this.V[this.X]} > ${this.V[this.Y]} = ${this.V[this.X] > this.V[this.Y]}`);
	                        var intermediate = this.V[this.X] - this.V[this.Y];
	                        if (intermediate < 0) {
	                            this.V[0xF] = 0;
	                            this.V[this.X] = intermediate + 256;
	                        }
	                        else {
	                            this.V[0xF] = 1;
	                            this.V[this.X] = intermediate;
	                        }
	                        break;
	                    case 0x0006:
	                        // If the least-significant bit of Vx is 1, then VF is set to 1, otherwise 0. Then Vx is divided by 2.
	                        //console.log('8XY6: Set Vx = Vx SHR 1.');
	                        this.V[0xF] = this.V[this.X] & 0x0001;
	                        this.V[this.X] >>= 1;
	                        //console.log(`V${this.X} = ${this.V[this.X]}, VF = ${this.V[0xF]}`);
	                        break;
	                    case 0x0007:
	                        // If Vy > Vx, then VF is set to 1, otherwise 0. Then Vx is subtracted from Vy, and the results stored in Vx.
	                        //console.log('8XY7: Set Vx = Vy - Vx, set VF = NOT borrow.');
	                        //console.log(`V${this.X} = ${this.V[this.Y]} > ${this.V[this.X]} = ${this.V[this.Y] > this.V[this.X]}`);
	                        var intermediate = this.V[this.Y] - this.V[this.X];
	                        if (intermediate < 0) {
	                            this.V[0xF] = 0;
	                            this.V[this.X] = intermediate + 256;
	                        }
	                        else {
	                            this.V[0xF] = 1;
	                            this.V[this.X] = intermediate;
	                        }
	                        break;
	                    case 0x000E:
	                        // If the most-significant bit of Vx is 1, then VF is set to 1, otherwise to 0. Then Vx is multiplied by 2.
	                        //console.log('8XYE: Set Vx = Vx SHL 1.');
	                        this.V[0xF] = this.V[this.Y] & 0x80 ? 1 : 0;
	                        this.V[this.X] = (this.V[this.X] << 1) & 0xFF;
	                        break;
	                    default:
	                        console.error("Unknown opcode [0x0000]: 0x%X\n", this.Opcode);
	                        break;
	                }
	                break;
	            case 0x9000:
	                // The values of Vx and Vy are compared, and if they are not equal, the program counter is increased by 2.
	                //console.log('9xy0: Skip next instruction if Vx != Vy.');
	                //console.log(`9xy0: Skip next instruction if ${this.V[this.X]} != ${this.V[this.X]}.`);
	                if (this.V[this.X] != this.V[this.Y]) {
	                    this.ProgramCounter += 2;
	                }
	                break;
	            case 0xA000:
	                // The value of register I is set to nnn.
	                //console.log('ANNN: Set I = nnn.');
	                //console.log(`ANNN: Set I = ${this.NNN}.`);
	                this.I = this.NNN;
	                break;
	            case 0xB000:
	                // The program counter is set to nnn plus the value of V0.
	                //console.log('BNNN: Jump to location nnn + V0.');
	                //console.log(`BNNN: Jump to location ${this.NNN} + ${this.V[0]} = ${this.NNN + this.V[0]}.`);
	                this.ProgramCounter = this.NNN + this.V[0];
	                break;
	            case 0xC000:
	                // The interpreter generates a random number from 0 to 255, which is then ANDed with the value kk. The results are stored in Vx. See instruction 8xy2 for more information on AND.
	                //console.log('Cxkk: Set Vx = random byte AND kk.');
	                var rand = Math.round(Math.random() * 255);
	                //console.log(`${this.V[this.X]} = ${rand} AND ${this.KK} = ${rand & this.KK}.`);
	                this.V[this.X] = rand & this.KK;
	                break;
	            case 0xD000:
	                // The interpreter reads n bytes from memory, starting at the address stored in I. These bytes are then displayed as sprites on screen at coordinates (Vx, Vy). Sprites are XORed onto the existing screen. If this causes any pixels to be erased, VF is set to 1, otherwise it is set to 0. If the sprite is positioned so part of it is outside the coordinates of the display, it wraps around to the opposite side of the screen. See instruction 8xy3 for more information on XOR, and section 2.4, Display, for more information on the Chip-8 screen and sprites.
	                //console.log('Dxyn: Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision.');
	                var sprite = this.Memory.slice(this.I, this.I + this.N);
	                var vx = this.V[this.X];
	                var vy = this.V[this.Y];
	                // log sprite
	                // sprite.forEach(byte => console.log(byte.toString(2)));
	                var collision = 0;
	                for (var i = 0; i < sprite.byteLength; i++) {
	                    for (var j = 0; j < 8; j++) {
	                        var k = 1 << (7 - j);
	                        var spritePixel = sprite[i] & k ? 1 : 0;
	                        var currentY = (vy + i) % Chip8Spec_1.Chip8Spec.DISPLAY_HEIGHT;
	                        var currentX = (vx + j) % Chip8Spec_1.Chip8Spec.DISPLAY_WIDTH;
	                        var oldPixel = this.Display[currentY][currentX];
	                        var newPixel = spritePixel ^ oldPixel;
	                        this.Display[currentY][currentX] = newPixel;
	                        if (oldPixel & spritePixel) {
	                            collision = 1;
	                        }
	                    }
	                }
	                this.V[0xF] = collision;
	                //console.log(`Display ${this.N}-byte sprite from ${this.I} at (${this.V[this.X]}, ${this.V[this.Y]}), set VF = ${collision}.`);
	                break;
	            case 0xE000:
	                switch (this.Opcode & 0x00FF) {
	                    case 0x009E:
	                        // Checks the keyboard, and if the key corresponding to the value of Vx is currently in the down position, PC is increased by 2.
	                        //console.log(`Ex9E: Skip next instruction if key with the value of Vx (${this.V[this.X]}) is pressed.`);
	                        var key = this.V[this.X];
	                        if (this.Keys[key]) {
	                            //console.log(`${key} is pressed. Skip`);
	                            this.ProgramCounter += 2;
	                        }
	                        else {
	                        }
	                        break;
	                    case 0x00A1:
	                        // Checks the keyboard, and if the key corresponding to the value of Vx is currently in the up position, PC is increased by 2.
	                        //console.log(`ExA1: Skip next instruction if key with the value of Vx (${this.V[this.X]}) is not pressed.`);
	                        var key = this.V[this.X];
	                        if (this.Keys[key]) {
	                        }
	                        else {
	                            //console.log(`${key} is NOT pressed. Skip`);
	                            this.ProgramCounter += 2;
	                        }
	                        break;
	                    default:
	                        console.error("Unknown opcode [0x0000]: 0x%X\n", this.Opcode);
	                        break;
	                }
	                break;
	            case 0xF000:
	                switch (this.Opcode & 0x00FF) {
	                    case 0x0007:
	                        // The value of DT is placed into Vx.
	                        //console.log('Fx07: Set Vx = delay timer value.');
	                        //console.log(`V${this.X} = ${this.DelayTimer}`);
	                        this.V[this.X] = this.DelayTimer;
	                        break;
	                    case 0x000A:
	                        // All execution stops until a key is pressed, then the value of that key is stored in Vx.
	                        //console.log('Fx0A: Wait for a key press, store the value of the key in Vx.');
	                        if (!this.AwaitingKey) {
	                            this.AwaitingKey = true;
	                            return;
	                        }
	                        this.Keys.forEach(function (key, index) {
	                            if (key) {
	                                _this.V[_this.X] = index;
	                            }
	                            _this.AwaitingKey = false;
	                        });
	                        break;
	                    case 0x0015:
	                        // DT is set equal to the value of Vx.
	                        console.log("Fx15: Set delay timer = Vx = V" + this.X + " = " + this.V[this.X]);
	                        this.DelayTimer = this.V[this.X];
	                        break;
	                    case 0x0018:
	                        // ST is set equal to the value of Vx.
	                        //console.log(`Fx18: Set sound timer = Vx = ${this.V[this.X]}`);
	                        this.SoundTimer = this.V[this.X];
	                        break;
	                    case 0x001E:
	                        // The values of I and Vx are added, and the results are stored in I.
	                        //console.log('Fx1E: Set I = I + Vx.');
	                        var vx = this.V[this.X];
	                        var i = vx + this.I;
	                        this.I = i & 0x0FFF; // TODO: do i need to truncate in case of overflow?
	                        //console.log(`I = ${i} + ${vx}`);
	                        break;
	                    case 0x0029:
	                        // The value of I is set to the location for the hexadecimal sprite corresponding to the value of Vx. See section 2.4, Display, for more information on the Chip-8 hexadecimal font.
	                        //console.log('Fx29: Set I = location of sprite for digit Vx.');
	                        //console.log(`x = ${this.X}, Vx = ${this.V[this.X]}`);
	                        //console.log(`I = ${Chip8Spec.GET_CHAR_LOCATION(this.V[this.X])}`);
	                        this.I = Chip8Spec_1.Chip8Spec.GET_CHAR_LOCATION(this.V[this.X]);
	                        break;
	                    case 0x0033:
	                        // The interpreter takes the decimal value of Vx, and places the hundreds digit in memory at location in I, the tens digit at location I+1, and the ones digit at location I+2.
	                        //console.log('Fx33: Store BCD representation of Vx in memory locations I, I+1, and I+2.');
	                        var vx = this.V[this.X];
	                        var vx_hundred = Math.floor((vx % 1000) / 100);
	                        var vx_ten = Math.floor((vx % 100) / 10);
	                        var vx_one = vx % 10;
	                        //console.log(`memory[${this.I}] = V${this.X} == ${vx}: ${vx_hundred}, ${vx_ten}, ${vx_one}`);
	                        this.Memory[this.I] = vx_hundred;
	                        this.Memory[this.I + 1] = vx_ten;
	                        this.Memory[this.I + 2] = vx_one;
	                        break;
	                    case 0x0055:
	                        // The interpreter copies the values of registers V0 through Vx into memory, starting at the address in I.
	                        //console.log('Fx55: Store registers V0 through Vx in memory starting at location I.');
	                        for (var i = 0; i <= this.X; i++) {
	                            this.Memory[this.I + i] = this.V[i];
	                        }
	                        break;
	                    case 0x0065:
	                        // The interpreter reads values from memory starting at location I into registers V0 through Vx.
	                        //console.log(`Fx65: Read registers V0 through Vx (V${this.X}) from memory starting at location I.`);
	                        for (var i = 0; i <= this.X; i++) {
	                            this.V[i] = this.Memory[this.I + i];
	                        }
	                        break;
	                    default:
	                        console.error("Unknown opcode [0x0000]: 0x%X\n", this.Opcode);
	                        break;
	                }
	                break;
	        }
	        // console.groupEnd();
	    };
	    Chip8.prototype.setOpcodeFromMemory = function () {
	        this.Opcode = this.Memory[this.ProgramCounter] << 8 | this.Memory[this.ProgramCounter + 1];
	    };
	    Chip8.prototype.unpackOpcode = function () {
	        this.X = this.getX();
	        this.Y = this.getY();
	        this.NNN = this.getNNN();
	        this.KK = this.getKK();
	        this.N = this.getN();
	    };
	    Chip8.prototype.getX = function () {
	        return (this.Opcode & 0x0F00) >> 8;
	    };
	    Chip8.prototype.getY = function () {
	        return (this.Opcode & 0x00F0) >> 4;
	    };
	    Chip8.prototype.getNNN = function () {
	        return this.Opcode & 0x0FFF;
	    };
	    Chip8.prototype.getKK = function () {
	        return this.Opcode & 0x00FF;
	    };
	    Chip8.prototype.getN = function () {
	        return this.Opcode & 0x000F;
	    };
	    Chip8.prototype.updateTimers = function () {
	        // Update timers
	        if (this.AwaitingKey) {
	            return;
	        }
	        if (this.DelayTimer > 0) {
	            this.DelayTimer--;
	        }
	        if (this.SoundTimer > 0) {
	            if (this.SoundTimer == 1) {
	            }
	            this.SoundTimer--;
	        }
	    };
	    Chip8.prototype.initializeDisplay = function () {
	        // console.info('Initialize display');
	        this.Display = [];
	        for (var y = 0; y < Chip8Spec_1.Chip8Spec.DISPLAY_HEIGHT; y++) {
	            this.Display.push([]);
	            for (var x = 0; x < Chip8Spec_1.Chip8Spec.DISPLAY_WIDTH; x++) {
	                this.Display[y].push(0);
	            }
	        }
	    };
	    return Chip8;
	}());
	exports.Chip8 = Chip8;


/***/ },
/* 2 */
/***/ function(module, exports) {

	"use strict";
	var Chip8Spec;
	(function (Chip8Spec) {
	    Chip8Spec.DISPLAY_WIDTH = 64;
	    Chip8Spec.DISPLAY_HEIGHT = 32;
	    Chip8Spec.PC_START = 0x200;
	    Chip8Spec.FONT_START = 0x50;
	    Chip8Spec.FONTSET = [
	        0xF0, 0x90, 0x90, 0x90, 0xF0,
	        0x20, 0x60, 0x20, 0x20, 0x70,
	        0xF0, 0x10, 0xF0, 0x80, 0xF0,
	        0xF0, 0x10, 0xF0, 0x10, 0xF0,
	        0x90, 0x90, 0xF0, 0x10, 0x10,
	        0xF0, 0x80, 0xF0, 0x10, 0xF0,
	        0xF0, 0x80, 0xF0, 0x90, 0xF0,
	        0xF0, 0x10, 0x20, 0x40, 0x40,
	        0xF0, 0x90, 0xF0, 0x90, 0xF0,
	        0xF0, 0x90, 0xF0, 0x10, 0xF0,
	        0xF0, 0x90, 0xF0, 0x90, 0x90,
	        0xE0, 0x90, 0xE0, 0x90, 0xE0,
	        0xF0, 0x80, 0x80, 0x80, 0xF0,
	        0xE0, 0x90, 0x90, 0x90, 0xE0,
	        0xF0, 0x80, 0xF0, 0x80, 0xF0,
	        0xF0, 0x80, 0xF0, 0x80, 0x80 // F
	    ];
	    Chip8Spec.GET_CHAR_LOCATION = function (char) {
	        // Each char is 5 bytes long
	        return Chip8Spec.FONT_START + (char * 5);
	    };
	})(Chip8Spec = exports.Chip8Spec || (exports.Chip8Spec = {}));


/***/ }
/******/ ]);