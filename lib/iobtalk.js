

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
                role: "indicator",
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
                role: "indicator",
                read: true,
                write: true,
            },
            native: {},
        });
        this.adapter.subscribeStates(this.name + ".SendMessage");
        this.adapter.subscribeStates(this.name + ".LastReceivedMessage");
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

    onStateChange(id, state) {

        const as = id.split(".");
        const statename = as[as.length - 1];

        if (statename == "SendMessage") {
            this.SendToGroup(state.val);
            // TODO: ACK change
        }
        else if (statename == "LastReceivedMessage") {
            if (state.ack == true) {
                // Message was acknowledged check rx queue
                console.log("LastReceivedMessage was ack");
            }
        }
    }




}

module.exports = iobTalk;