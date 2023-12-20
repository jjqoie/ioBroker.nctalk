"use strict";

/*
 * Created with @iobroker/create-adapter v2.0.1
 */

/*
Ideas for the future:
text2command integration
group list attribute for every room to send multicast message to multiple rooms belonging to one group
smarthome/iobroker user gets a set of "botfather" functions as an alternative (password protected) way to configure this adapter - to create/organize new rooms/groups
Add filter to allow only nctalk group and/or 1to1 conversation types to be Used
New 1to1/group conversation will automatically be joined (ListenModeActive=true) either password protected or after request sent to the nextcloud talk admin was approved
Use iobroker state ack for queue handling in case of message bursts and not to miss any message
Create devices per group or chat room with own rxmessage and SendMessage state
Support for a jsonobject in rx/txmessage states
*/

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");

//process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

//const NextcloudTalk = require("./src/nctalkclient");  // For development - have nctalkclient sources locally
const NextcloudTalk = require("nctalkclient");
const iobTalk = require("./lib/iobtalk");
const webdavsupport = require("./lib/webdavsupport");


// Load your modules here, e.g.:
// const fs = require("fs");

// let debugadapter = undefined;

// global.ErrorLog = function ErrorLog(e) {
//     if (typeof e === "object" && e !== null) {
//         debugadapter.log.error("Error Event" + JSON.stringify(e));
//     } else {
//         debugadapter.log.error("Error Event " + e);
//     }
// };

// global.DebugLog = function DebugLog(e) {
//     if (typeof e === "object" && e !== null) {
//         debugadapter.log.info("Debug Event" + JSON.stringify(e));
//     } else {
//         debugadapter.log.info("Debug Event " + e);
//     }
// };

class Nctalk extends utils.Adapter {
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    constructor(options) {
        super({
            ...options,
            name: "nctalk",
        });
        this.on("ready", this.onReady.bind(this));
        this.on("stateChange", this.onStateChange.bind(this));
        // this.on("objectChange", this.onObjectChange.bind(this));
        this.on("message", this.onMessage.bind(this));
        this.on("unload", this.onUnload.bind(this));

        this.grouplist = [];

        // debugadapter = this;


    }

    _GroupListAdd(cfgstring, token) {
        const gs = cfgstring.split(",");
        gs.forEach(gselement => {
            const index = this.grouplist.findIndex((glelement) => { return glelement.name == gselement; });
            if (index != -1) {
                this.log.debug("Add element to group");
                this.grouplist[index].tokenlist.push(token);
            }
            else {
                this.log.debug("Create new group with first token");
                this.grouplist.push({ name: gselement, iobTalk: gselement, tokenlist: [token] });
            }
        });
    }

    CreateGroupList(AdminRooms) {
        AdminRooms.forEach(element => {
            if (element.groups)
                this._GroupListAdd(element.groups, element.token);
        });

        this.grouplist.forEach(element => {
            element.iobTalk = new iobTalk(this, element.name, element.tokenlist);
        });

    }

    SetRoomsListenMode(AdminRooms) {
        AdminRooms.forEach(element => {
            if (element.active) {
                this.Talk.RoomListenMode(element.token, true);
            }
        });
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        //this.createState;
        // Initialize your adapter here

        // The adapters config (in the instance object everything under the attribute "native") is accessible via
        // this.config:

        // {"host":"nextcloud.domain.de","protocol":"https","port":443,"user":"user","password":"password",
        // "AdminRooms": [{ "name": "room1", "token": "123", "type": "4", "groups": "glb,group1", "text2command": "", "active": false },
        //                { "name": "room2", "token": "234", "type": "2", "groups": "glb,group2", "text2command": "", "active": false },
        //                { "name": "room3", "token": "345", "type": "1", "groups": "glb,group1,group2", "text2command": "", "active": false }] }

        this.Talk = new NextcloudTalk({
            server: this.config.host,
            user: this.config.user,
            pass: this.config.password,
            port: this.config.port,
            debug: this.config.debuglog
        });

        this.log.info(`Create nctalkclient - Version: ${this.Talk.GetVersion()}`);

        this.webdavsupport = new webdavsupport(this, this.config);
        this.webdavsupport.CreateUploadPathIfnotExist();

        this.Talk.start(500);

        // Talk client is ready and has fetched all required information / data to handle conversations
        this.Talk.on("Ready", (listofrooms) => {
            this.log.info("Talk client is ready and has fetched capabilities and room information");

            this.CreateGroupList(this.config.AdminRooms);

            this.SetRoomsListenMode(this.config.AdminRooms);

        });

        // Error
        this.Talk.on("Error", (e) => {
            if (typeof e === "object" && e !== null) {
                this.log.error("Error Event" + JSON.stringify(e));
            } else {
                this.log.error("Error Event " + e);
            }
        });

        // Debug
        this.Talk.on("Debug", (e) => {
            if (typeof e === "object" && e !== null) {
                this.log.debug("Debug Event" + JSON.stringify(e));
            } else {
                this.log.debug("Debug Event " + e);
            }
        });


        // this.webdavsupport.UploadFileFromURL("nctalk.jpg","https://raw.githubusercontent.com/jjqoie/iobroker.nctalk/main/img/nctalk-Push.jpg");
        // this.webdavsupport.UploadFileFromURL("tNpm2qxWkZ9rAXo.jpg","http://openmediavault/s/tNpm2qxWkZ9rAXo/preview");

        // INFO: States and subscribes are made with each group instance of iobTalk in CreateGroupList

    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            // Here you must clear all timeouts or intervals that may still be active
            // clearTimeout(timeout1);
            // clearTimeout(timeout2);
            // ...
            // clearInterval(interval1);

            callback();
        } catch (e) {
            callback();
        }
    }

    // If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
    // You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
    // /**
    //  * Is called if a subscribed object changes
    //  * @param {string} id
    //  * @param {ioBroker.Object | null | undefined} obj
    //  */
    // onObjectChange(id, obj) {
    //     if (obj) {
    //         // The object was changed
    //         this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
    //     } else {
    //         // The object was deleted
    //         this.log.info(`object ${id} deleted`);
    //     }
    // }

    /**
     * Is called if a subscribed state changes
     * @param {string} id
     * @param {ioBroker.State | null | undefined} state
     */
    onStateChange(id, state) {

        const as = id.split(".");

        const index = this.grouplist.findIndex((element) => { return element.name == as[2]; });

        if (index != -1) {
            // Group was found
            this.grouplist[index].iobTalk.onStateChange(id, state);
        }
    }

    // If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
    /**
     * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
     * Using this method requires "common.messagebox" property to be set to true in io-package.json
     * @param {ioBroker.Message} obj
     */
    onMessage(obj) {
        if (typeof obj === "object" && obj.message) {
            if (obj.command === "send") {
                // e.g. send email or pushover or whatever
                this.log.info("my adapter send command");

                // Send response in callback if required
                if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
            } else if (obj.command === "rooms") {
                // e.g. send email or pushover or whatever
                this.log.info("my adapter rooms command");

                // Send response in callback if required
                if (obj.callback) this.sendTo(obj.from, obj.command, JSON.stringify(this.Talk.rooms.getlistofrooms()), obj.callback);
            }

        }
    }

}

if (require.main !== module) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new Nctalk(options);
} else {
    // otherwise start the instance directly
    new Nctalk();
}
