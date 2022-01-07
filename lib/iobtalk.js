

class iobTalk {
    constructor(adapter, name, tokenlist) {
        this.adapter = adapter;
        this.name = name;
        this.tokenlist = tokenlist;

        this.CreateStates();
        this.RegisterEvents();

    }

    CreateStates() {
        this.adapter.setObjectNotExists(this.name + ".SendMessage", {
            type: "state",
            common: {
                name: "SendMessage",
                type: "string",
                role: "state",
                read: true,
                write: true,
            },
            native: {},
        });

        this.adapter.setObjectNotExists(this.name + ".LastReceivedMessage", {
            type: "state",
            common: {
                name: "LastReceivedMessage",
                type: "string",
                role: "state",
                read: true,
                write: false,
            },
            native: {},
        });

        this.adapter.setObjectNotExists(this.name + ".ShareFile.NextcloudPath", {
            type: "state",
            common: {
                name: "Share an already uploaded and existing file",
                type: "string",
                role: "state",
                read: true,
                write: true,
            },
            native: {},
        });
        this.adapter.setObjectNotExists(this.name + ".ShareFile.URL", {
            type: "state",
            common: {
                name: "Fetch file from Obj.url, upload to Obj.filename and share it",
                type: "string",
                role: "JSON",
                read: true,
                write: true,
            },
            native: {},
        });
        this.adapter.setObjectNotExists(this.name + ".ShareFile.UploadShareObj", {
            type: "state",
            common: {
                name: "Provided Obj.filename and Obj.data is uploaded and shared",
                type: "string",
                role: "JSON",
                read: true,
                write: true,
            },
            native: {},
        });
        this.adapter.subscribeStates(this.name + ".SendMessage");
        this.adapter.subscribeStates(this.name + ".LastReceivedMessage");
        this.adapter.subscribeStates(this.name + ".ShareFile.NextcloudPath");
        this.adapter.subscribeStates(this.name + ".ShareFile.URL");
        this.adapter.subscribeStates(this.name + ".ShareFile.UploadShareObj");
    }

    MessageReceived(msg) {
        if (msg[0].actorId.toLowerCase() == this.adapter.Talk.GetOwnActorIdLowerCase()) {
            console.log("OWN MESSAGEEVENT " + msg[0].message);
        }
        else {
            console.log("MESSAGEEVENT " + msg[0].message);

            this.adapter.setStateAsync(this.name + ".LastReceivedMessage", msg[0].message);

            // if (msg[0].message == "time") {
            //     this.SendToGroup(new Date().toLocaleString());
            // }
            // if (msg[0].message == "test") {
            //     this.SendToGroup("test reply");
            // }
        }
    }

    RegisterEvents() {
        this.tokenlist.forEach(token => {
            console.log(this.name, "Message_" + token);
            this.adapter.Talk.on("Message_" + token, this.MessageReceived.bind(this));
        });
    }

    SendToGroup(msg) {
        this.tokenlist.forEach(token => {
            this.adapter.Talk.SendMessage(token, msg);
        });
    }
    ShareFilePathToGroup(path) {
        this.tokenlist.forEach(token => {
            this.adapter.Talk.ShareFile(token, path);
        });
    }

    onStateChange(id, state) {

        const as = id.split(".");
        const statename = as[as.length - 1];
        let obj = undefined;
        let fullpath = this.adapter.config.upload_path;


        switch (statename) {
            case "SendMessage":
                this.SendToGroup(state.val);
                // TODO: ACK change
                break;
            case "LastReceivedMessage":
                if (state.ack == true) {
                    // Message was acknowledged check rx queue
                    console.log("LastReceivedMessage was ack");
                }
                break;
            case "NextcloudPath":
                this.ShareFilePathToGroup(state.val);
                break;
            case "URL":
                obj = undefined;
                //{"filename": "nctalk.jpg", "url": "https://raw.githubusercontent.com/jjqoie/iobroker.nctalk/main/img/nctalk-Push.jpg" }
                // console.log(typeof (state.val));
                // console.log(state.val);
                if (typeof (state.val) === "string") {
                    obj = JSON.parse(state.val);
                } else if (typeof (state.val) === "object") {
                    obj = state.val;
                }
                if (obj != undefined) {
                    // TODO: Add checks for filename and url

                    (async () => {
                        // Wait until file was uploaded via webdav before calling ShareFile API
                        const result = await this.adapter.webdavsupport.UploadFileFromURL(obj.filename, obj.url);
                        if (result != false) {
                            fullpath = fullpath + "/" + obj.filename;
                            this.ShareFilePathToGroup(fullpath);
                        } else {
                            this.adapter.log.error(`UploadFileFromURL failed, ${obj.filename}, ${obj.url}`);
                        }
                    })();
                }
                break;
            case "UploadShareObj":
                obj = undefined;
                //console.log(typeof (state.val));
                if (typeof (state.val) === "string") {
                    obj = JSON.parse(state.val);
                    obj.data = Buffer.from(obj.data.data);
                } else if (typeof (state.val) === "object") {
                    obj = state.val;
                }
                if (obj != undefined) {
                    // TODO: Add checks for filename and data
                    (async () => {
                        // Wait until file was uploaded via webdav before calling ShareFile API
                        const result = await this.adapter.webdavsupport.UploadFile(obj.filename, obj.data);
                        if (result != false) {
                            fullpath = fullpath + "/" + obj.filename;
                            this.ShareFilePathToGroup(fullpath);
                        } else {
                            this.adapter.log.error(`UploadFile failed, ${obj.filename}, ${typeof(obj.data)}`);
                        }
                    })();
                }
                break;
        }
    }




}



module.exports = iobTalk;