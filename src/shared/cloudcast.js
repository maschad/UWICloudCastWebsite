(function (window) {

    // Defaults
    var BASE_URL = "wss://cloudcast.sheffield.ac.uk/api/v0";
    var ENDPOINT = "/asr/decode";
    var DECODER = "gmm";
    var END_OF_STREAM_TAG = "EOS";
    var RECORDER_WORKER_PATH = 'recorderWorker.js';

    // Used by server to detect audio stream
    var CONTENT_TYPE = "content-type=audio/x-raw,+layout=(string)interleaved,+rate=(int)16000,+format=(string)S16LE,+channels=(int)1";

    // Send 4 blocks per second as recommended in the original server doc
    var INTERVAL = 250;

    /**
     * Enum for error codes (mostly following Android error names and codes)
     * @readonly
     * @enum {number}
     */
    var ERROR = {
        /** Network error */
        NETWORK: 2,
        /** Audio error */
        AUDIO: 3,
        /** Server error */
        SERVER: 4,
        /** Client error */
        CLIENT: 5,
        label: {
            2: 'NETWORK',
            3: 'AUDIO',
            4: 'SERVER',
            5: 'CLIENT',
        }
    }

    /**
     * Enum for event codes, used for internal message passing
     * @readonly
     * @enum {number}
     */
    var MESSAGE = {
        /** Waiting for microphone authorisation */
        WAITING_MICROPHONE: 1,
        /** Created a media stream source */
        CREATED_MEDIA_STREAM: 2,
        /** Created the sound recorder instance */
        CREATED_RECORDER: 3,
        /** Initialised interface */
        INITIALIZED: 4,
        /** Successfully sent a payload to the server */
        SEND: 5,
        /** Successfully sent an empty payload to the server */
        SEND_EMPTY: 6,
        /** Successfully sent the end-of-stream tag to server */
        SEND_EOS: 7,
        /** A message was received through the WebSocket */
        WEBSOCKET: 8,
        /** The WebSocket connection was open */
        WEBSOCKET_OPEN: 9,
        /** The WebSocket connection was closed */
        WEBSOCKET_CLOSE: 10,
        /** The recorder has stopped receiving audio */
        STOP: 11,
        /** The recorder has stopped receiving audio */
        label: {
            1: 'WAITING_MICROPHONE',
            2: 'CREATED_MEDIA_STREAM',
            3: 'CREATED_RECORDER',
            4: 'INITIALIZED',
            5: 'SEND',
            6: 'SEND_EMPTY',
            7: 'SEND_EOS',
            8: 'WEBSOCKET',
            9: 'WEBSOCKET_OPEN',
            10: 'WEBSOCKET_CLOSE',
            11: 'STOP',
        }
    };

    /**
     * Enum for response codes, compatible with WebSocket codes
     * as stated in RFC6455.
     * @readonly
     * @enum {number}
     */
    var CODES = {
        /** Normal closure  */
        WS_FINISHED: 1000,
        /** Endpoint is "going away" (eg. server went down) */
        WS_GOING_AWAY: 1001,
        /** Connection ended due to protocol error */
        WS_PROTOCOL_ERROR: 1002,
        /** Connection ended due to faulty or unprocessable data */
        WS_UNACCEPTABLE_DATA: 1003,
        /** Connection ended due to mismatch between type and content of data */
        WS_BAD_INPUT: 1007,
        /** Connection ended due to generic policy violation */
        WS_POLICY_VIOLATION: 1008,
        /** Connection ended due to excessive payload size */
        WS_TOO_BIG: 1009,
        /** Client ended connection because of missing extension in handshake */
        WS_BAD_EXTENSION: 1010,
        /** Server ended connection because unexpected conditions */
        WS_UNEXPECTED_CONDITION: 1011,
        /** Transaction with server was successful */
        SUCCESS: 4000,
        /** Transaction with server was aborted */
        ABORTED: 4001,
        /** Connection ended because server received no speech data */
        NO_SPEECH: 4002,
        /** Connection ended because server received faulty input */
        BAD_INPUT: 4003,
        /** Connection ended due to client requesting a forbidden operation */
        BAD_PERMISSIONS: 4004,
        /** Connection ended due to no available workers for current job */
        NOT_AVAILABLE: 4005,
        /** Connection ended due to a missing resource on server end */
        RESOURCE_MISSING: 4006,
        /** Connection ended due to an unsupported request from client */
        NOT_SUPPORTED: 4007,
        /** Connection ended due to an error in processing provided grammar */
        BAD_GRAMMAR: 4008,
        /** Connection ended due to an error in the decoding process */
        DECODER_ERROR: 4009,
        /** State marker: entity has been created */
        CREATED: 4100,
        /** State marker: connection established */
        CONNECTED: 4101,
        /** State marker: initialisation is complete */
        INITIALIZED: 4102,
        /** State marker: entity is ready for accepting data */
        READY: 4103,
        /** State marker: entity has started receiving data */
        STARTED: 4104,
        /** State marker: entity has received the end of data */
        FINISHING: 4105,
        /** State marker: entity has decided to abort processing */
        ABORTING: 4105,
        /** State marker: entity has finished processing */
        FINISHED: 4199,
        label: {
            1000: 'WS_FINISHED',
            1001: 'WS_GOING_AWAY',
            1002: 'WS_PROTOCOL_ERROR',
            1003: 'WS_UNACCEPTABLE_DATA',
            1007: 'WS_BAD_INPUT',
            1008: 'WS_POLICY_VIOLATION',
            1009: 'WS_TOO_BIG',
            1010: 'WS_BAD_EXTENSION',
            1011: 'WS_UNEXPECTED_CONDITION',
            4000: 'SUCCESS',
            4001: 'ABORTED',
            4002: 'NO_SPEECH',
            4003: 'BAD_INPUT',
            4004: 'BAD_PERMISSIONS',
            4005: 'NOT_AVAILABLE',
            4006: 'RESOURCE_MISSING',
            4007: 'NOT_SUPPORTED',
            4008: 'BAD_GRAMMAR',
            4009: 'DECODER_ERROR',
            4100: 'CREATED',
            4101: 'CONNECTED',
            4102: 'INITIALIZED',
            4103: 'READY',
            4104: 'STARTED',
            4105: 'FINISHING',
            4105: 'ABORTING',
            4199: 'FINISHED',
        }
    };

    /**
     * Construct a CloudCAST object
     * @class
     * @name CloudCAST
     *
     * @param {object} config - Configuration object
     *
     * @property {string} username - The username to use when contacting the API [required]
     * @property {string} application - The application to use when contacting the API [required]
     * @property {string} baseURL - The base URL for API calls
     * @property {string} endpoint - The API endpoint to use for decoding
     * @property {string} decoder - The name of the decoder to request
     * @property {string} contentType - The content type string to send to the server
     * @property {string} interval - The interval in miliseconds between messages to the server
     * @property {string} recorderWorkerPath - The path to the worker library
     * @property {string} state - The current state of the interface
     *
     * @fires CloudCAST#onInit
     * @fires CloudCAST#onReady
     * @fires CloudCAST#onResult
     * @fires CloudCAST#onPartialResult
     * @fires CloudCAST#onAlignment
     * @fires CloudCAST#onPartialAlignment
     * @fires CloudCAST#onAdaptationState
     * @fires CloudCAST#onClose
     * @fires CloudCAST#onStartedListening
     * @fires CloudCAST#onStoppedListening
     * @fires CloudCAST#onEvent
     * @fires CloudCAST#onError
     */
    var CloudCAST = function (cfg) {
        var config = cfg || {};
        if (!config.username)    throw 'CloudCAST: Username is required';
        if (!config.application) throw 'CloudCAST: Application name is required'

        config.baseURL             = config.baseURL             || BASE_URL;
        config.endpoint            = config.endpoint            || ENDPOINT;

        config.URL = config.baseURL
            + '/user/' + config.username + '/app/'
            + config.application + config.endpoint;

        config.decoder             = config.decoder             || DECODER;
        config.contentType         = config.contentType         || CONTENT_TYPE;
        config.interval            = config.interval            || INTERVAL;
        config.recorderWorkerPath  = config.recorderWorkerPath  || RECORDER_WORKER_PATH;

        /**
         * onInit - Interface is initialised (ie, microphone is connected, etc)
         * @event CloudCAST#onInit
         */
        config.onInit = config.onInit || function () { };

        /**
         * onReady - Fired when interface is ready to send audio
         * @event CloudCAST#onReady
         */
        config.onReady = config.onOpen || config.onReady || function () { };
        /**
         * onResult- Fired when a final result is received
         * @event CloudCAST#onResult
         * @param {object} data - The result object
         */
        config.onResult = config.onResult || function (data) { };

        /**
         * onPartialResult - Fired when a partial result is received
         * @event CloudCAST#onPartialResult
         * @param {object} data - The partial result object
         */
        config.onPartialResult = config.onPartialResult || function (data) { };

        /**
         * onAlignment - Fired when a final alignment is received
         * @event CloudCAST#onAlignment
         * @param {object} data - The alignment object
         */
        config.onAlignment = config.onAlignment || function (data) { };

        /**
         * onPartialAlignment - Fired when a partial alignment is received
         * @event CloudCAST#onPartialAlignment
         * @param {object} data - The partial alignment object
         */
        config.onPartialAlignment
            = config.onPartialAlignment || function (data) { };

        /**
         * onAdaptationState - Fired when an adaptation state is received (NYI)
         * @event CloudCAST#onAdaptationState
         */
        config.onAdaptationState
            = config.onAdaptationState || function () { };

        /**
         * onClose - Fired when the connection is closed
         * @event CloudCAST#onClose
         */
        config.onClose = config.onClose || function () { };

        /**
         * onStartedListening - Fired when client starts capturing audio
         * @event CloudCAST#onStartedListening
         */
        config.onStartedListening
            = config.onStartedListening || function () { };

        /**
         * onStoppedListening - Fired when client is no longer capturing audio
         * @event CloudCAST#onStoppedListening
         */
        config.onStoppedListening =
            config.onStoppedListening || function () { };

        /**
         * onEvent - Fired when a significant event is registered
         * @event CloudCAST#onEvent
         * @param {number} code - The event code
         * @param {object} data - An event-specific payload
         */
        config.onEvent = config.onEvent || function (code, data) { };

        /**
         * onError - Fired when an error is raised
         * @event CloudCAST#onError
         * @param {number} code - The error code
         * @param {string} string - An error message for debugging
         */
        config.onError = config.onError || function (code, data) { };

        this.state = CODES.CREATED;

        var audioContext;
        var recorder;

        // Initializes audioContext
        /**
         * @function
         * @name CloudCAST~init
         * Set up the recorder, including asking for microphone permissions.
         * Can be called multiple times.
         */
        this.init = function () {
            config.onEvent(MESSAGE.WAITING_MICROPHONE, "Waiting for approval to access your microphone ...");

            try {
                window.AudioContext =
                    window.AudioContext ||
                    window.webkitAudioContext;
                //#TODO: Remove this as getUsermedia is now browser independent
                // navigator.getUserMedia =
                //     navigator.getUserMedia              ||
                //     navigator.webkitGetUserMedia        ||
                //     navigator.mozGetUserMedia;

                window.URL = window.URL || window.webkitURL;
                audioContext = new AudioContext();
            }
            catch (e) {
                // Firefox 24: TypeError: AudioContext is not a constructor
                // Set media.webaudio.enabled = true (in about:config) to fix this.
                config.onError(ERROR.CLIENT, "Error initializing Web Audio browser: " + e);
            }

            if (navigator.getUserMedia) {
                navigator.getUserMedia(
                    { audio: true },
                    startUserMedia,
                    function (e) {
                        config.onError(ERROR.CLIENT, "No live audio input in this browser: " + e);
                    }
                );
            }
            else {
                config.onError(ERROR.CLIENT, "No user media support");
            }

            this.state = CODES.INITIALIZED;
            config.onEvent(MESSAGE.INITIALIZED, 'Initialised CloudCAST instance');
            config.onInit();
        }

        /**
         * @function open
         * Start a WebSocket connection to the specified API endpoint. The
         * connection will open when the server is ready to receive data, which
         * will trigger the {@link onReady} event and register the
         * WEBSOCKET_OPEN event with {@link onEvent}.
         *
         * If the connection is successfully established, the interface state
         * will be set to CONNECTED. If an error is encountered, the CLIENT
         * error will be registered with {@link onError}.
         *
         * The WEBSOCKET event will be registered with {@link onEvent} every
         * time a message is received through the WebSocket. If the message
         * received is an object or a Blob, or if a status other than SUCCESS
         * is received from the server, the SERVER error will be registered
         * with {@link onError}.
         *
         * @fires CloudCAST#onReady
         * @fires CloudCAST#onError
         */
        this.open = function () {
            if (ws) {
                this.cancel();
            }

            try {
                ws = createWebSocket();
                this.state = CODES.CONNECTED;
            } catch (e) {
                config.onError(ERROR.CLIENT, "No web socket support in this browser!");
            }
        }

        /**
         * @function close
         * Close the WebSocket connection
         *
         * @fires CloudCAST#onClose
         */
        this.close = function () {
            if (ws) {
                ws.close();
                ws = null;
            }
        }

        /**
         * @function decoder
         * Gets or sets the current decoder
         * @param {string} [name] - The name of the decoder to use
         */
        this.decoder = function (name) {
            if (name) {
                config.decoder = name;
            }
            return config.decoder;
        }

        var ws;
        var intervalKey;

        /**
         * @function startListening
         * Start recording and transcribing
         *
         * @fires CloudCAST#onStartedListening
         * @fires CloudCAST#onError
         */
        this.startListening = function () {
//             console.log('Called startListening()');
            if (!recorder) {
                config.onError(ERROR.AUDIO, "Recorder undefined");
                return;
            }

            if (!ws) {
                config.onError(ERROR.CLIENT, "Websocket not created. Have you called open()?");
                return;
            }

            if (ws.readyState != ws.OPEN) {
                config.onError(ERROR.CLIENT, "Websocket not opened yet. Have you waited for onReady?");
                return;
            }

            intervalKey = setInterval(function () {
                    recorder.export16kMono(function (blob) {
                        send(blob);
                        recorder.clear();
                    }, 'audio/x-raw');
                },
                config.interval);

            config.onStartedListening();
            // Start recording
            recorder.record();
        }

        /**
         * @function stopListening
         * Stop recording and sending of new input.
         *
         * If successful, will trigger {@link onStoppedListening}. Otherwise,
         * {@link onError} will fire with the AUDIO code.
         *
         * Registers the STOP event with {@link onEvent}.
         *
         * @fires CloudCAST#onStoppedListening
         * @fires CloudCAST#onEvent
         * @fires CloudCAST#onError
         */
        this.stopListening = function () {
//             console.log('Called stopListening()');

            // Stop the regular sending of audio
            clearInterval(intervalKey);

            // Stop recording
            if (recorder) {
                recorder.stop();
                config.onEvent(MESSAGE.STOP, 'Stopped recording');
                // Push the remaining audio to the server
                recorder.export16kMono(function (blob) {
                    send(blob);
                    send(END_OF_STREAM_TAG);
                    recorder.clear();
                }, 'audio/x-raw');
                config.onStoppedListening();
            } else {
                config.onError(ERROR.AUDIO, "Recorder undefined");
            }
        }

        /**
         * @function cancelListening
         * Stops recording, without waiting for a response from the server.
         * Registers as the STOP event for {@link onEvent}.
         *
         * @fires CloudCAST#onEvent
         */
        this.cancelListening = function () {
//             console.log('Called cancelListening()');
            // Stop the regular sending of audio (if present)
            clearInterval(intervalKey);

            if (recorder) {
                recorder.stop();
                recorder.clear();
                config.onEvent(MESSAGE.STOP, 'Stopped recording');
            }
        }

        /**
         * @function cancel
         * High-level function to cancel transaction, without waiting for a
         * response from the server.
         *
         * Internally calls both {@link cancelListening} and {@link close}.
         *
         * @fires CloudCAST#onClose
         * @fires CloudCAST#onEvent
         */
        this.cancel = function () {
//             console.log('Called cancelListening()');
            this.cancelListening();
            this.close();
        }

        /**
         * @function startUserMedia
         * @param {object} stream - The stream object received from getUserMedia
         *
         * Called internally by getUserMedia with a stream object, and creates
         * a local stream source to initialise the recorder.
         *
         * These steps register respectively as CREATED_MEDIA_STREAM and
         * CREATED_RECORDER for {@link onEvent}.
         *
         * @fires CloudCAST#onEvent
         *
         * @private
         */
        function startUserMedia (stream) {
//             console.log('Called startUserMedia(%o)', stream);
            var input = audioContext.createMediaStreamSource(stream);
            config.onEvent(MESSAGE.CREATED_MEDIA_STREAM, 'Media stream created');

            // make the analyser available in window context
            window.userSpeechAnalyser = audioContext.createAnalyser();
            input.connect(window.userSpeechAnalyser);

            recorder = new Recorder(input, { workerPath: config.recorderWorkerPath });
            config.onEvent(MESSAGE.CREATED_RECORDER, 'Recorder initialised');
        }

        /**
         * @function send
         * @param {object} item - The payload to send
         *
         * Send data through the current WebSocket.
         *
         * This function registers different events with {@link onEvent}
         * depending on the contents of the payload and the result of the
         * transmission.
         *
         * A successful transmission registers the SEND event, unless the
         * payload was empty, in which case the SEND_EMPTY event is registered.
         * If the payload is a string matching the specified end-of-string tag,
         * the SEND_EOS event is registered.
         *
         * If the function is called before interface is ready, a NETWORK error
         * will be registered with {@link onError}. If, on the other hand, no
         * WebSocket connection is available at the time of calling, the CLIENT
         * error will be registered.
         *
         * @fires CloudCAST#onEvent
         * @fires CloudCAST#onError
         *
         * @private
         */
        function send (item) {
//             console.log('Called send(%o)', item);
            if (ws) {
                var state = ws.readyState;
                if (state == 1) {
                    // If item is an audio blob
                    if (item instanceof Blob) {
                        if (item.size > 0) {
                            ws.send(item);
                            config.onEvent(MESSAGE.SEND, 'Send: blob: ' + item.type + ', ' + item.size);
                        }

                        else {
                            config.onEvent(MESSAGE.SEND_EMPTY, 'Send: blob: ' + item.type + ', EMPTY');
                        }
                    }

                    // End of stream
                    else if (item == END_OF_STREAM_TAG) {
                        ws.send(item);
                        config.onEvent(MESSAGE.SEND_EOS, 'Send tag: ' + item);
                    }

                    // Item is a different command
                    else {
                        ws.send(item);
                        config.onEvent(MESSAGE.SEND, 'Send item: ' + item);
                    }
                }

                else {
                    config.onError(ERROR.NETWORK, 'WebSocket not ready! (' + state + "). Did not send: " + item);
                }
            }

            else {
                config.onError(ERROR.CLIENT, 'No web socket connection: failed to send: ' + item);
            }
        }

        /**
         * @function createWebSocket
         * @param {object} item - The payload to send
         *
         * Create a WebSocket connection to the server, and register the
         * appropriate listeners as connection callbacks.
         *
         * This function registers different events with {@link onEvent}
         * depending on the contents of the payload and the result of the
         * transmission.
         *
         * A successful transmission registers the SEND event, unless the
         * payload was empty, in which case the SEND_EMPTY event is registered.
         * If the payload is a string matching the specified end-of-string tag,
         * the SEND_EOS event is registered.
         *
         * If the function is called before interface is ready, a NETWORK error
         * will be registered with {@link onError}. If, on the other hand, no
         * WebSocket connection is available at the time of calling, the CLIENT
         * error will be registered.
         *
         * @fires CloudCAST#onEvent
         * @fires CloudCAST#onError
         *
         * @private
         */
        function createWebSocket() {
//             console.log('Called createWebSocket()');
            // TODO: do we need to use a protocol?
            //var ws = new WebSocket("ws://127.0.0.1:8081", "echo-protocol");
            var url = config.URL + '?' + config.contentType;
            if (config["decoder"]) {
                url += '&decoder=' + config["decoder"]
            }
            var ws = new WebSocket(url);

            // Start recording only if the socket becomes open
            ws.onopen = function (e) {
                config.onEvent(MESSAGE.WEBSOCKET_OPEN, e);
                config.onReady();
            };

            ws.onmessage = function (e) {
                var data = e.data;
                config.onEvent(MESSAGE.WEBSOCKET, data);
                if (data instanceof Object && !(data instanceof Blob)) {
                    config.onError(ERROR.SERVER, 'WebSocket: onEvent: got Object that is not a Blob');
                }

                else if (data instanceof Blob) {
                    config.onError(ERROR.SERVER, 'WebSocket: got Blob');
                }

                else {
                    var res = JSON.parse(data);

                    if (res.status == CODES.SUCCESS) {
                        if (res.result) {
                            if (res.result.final) {
                                config.onResult(res.result.hypotheses);
                            }

                            else {
                                config.onPartialResult(res.result.hypotheses);
                            }
                        }

                        else if (res.alignment) {
                            if (res.alignment.final) {
                                config.onAlignment(parsePhoneAlignmentHypotheses(res.alignment.hypotheses));
                            }

                            else {
                                config.onPartialAlignment(parsePhoneAlignmentHypotheses(res.alignment.hypotheses));
                            }
                        }

                        else if (res.adaptation_state) {
                            config.onAdaptationState(res.adaptation_state);
                        }
                    }

                    else {
                        config.onError(ERROR.SERVER, 'Server error: ' + res.status + ': ' + getDescription(res.status));
                    }
                }
            }

            // This can happen if the blob was too big
            // E.g. "Frame size of 65580 bytes exceeds maximum accepted frame size"
            // Status codes
            // http://tools.ietf.org/html/rfc6455#section-7.4.1
            // 1005:
            // 1006:
            ws.onclose = function (e) {
                var code = e.code;
                var reason = e.reason;
                var wasClean = e.wasClean;
                // The server closes the connection (only?)
                // when its endpointer triggers.

                config.onEvent(MESSAGE.WEBSOCKET_CLOSE,
                    "Websocket closed with code " + e.code + " (" + CODES.label[e.code] + "). " +
                    ((e.reason) ? "Reason: " + e.reason : "No reason given")
                );
                config.onClose();
            };

            ws.onerror = function (e) {
                var data = e.data;
                config.onError(ERROR.NETWORK, data);
            }

            return ws;
        }

        /**
         * @function getDescription
         * @param {number} code - The code number
         *
         * Returns a string with the message corresponding to the specified
         * error code.
         *
         * @private
         */
        function getDescription(code) {
            if (code in CODES.label) {
                return CODES.label[code];
            }
            return "Unknown error";
        }

    };

    // Simple class for persisting the transcription.
    // If isFinal==true then a new line is started in the transcription list
    // (which only keeps the final transcriptions).
    // TODO
    var Transcription = function (cfg) {
        var index = 0;
        var list = [];

        this.add = function (text, isFinal) {
            list[index] = text;
            if (isFinal) {
                index++;
            }
        }

        this.toString = function () {
            return list.join('. ');
        }
    }

    window.CloudCAST = CloudCAST;
    window.Transcription = Transcription;

})(window);
