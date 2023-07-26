![Logo](admin/nctalk.png)
# ioBroker.nctalk

[![NPM version](https://img.shields.io/npm/v/iobroker.nctalk.svg)](https://www.npmjs.com/package/iobroker.nctalk)
[![Downloads](https://img.shields.io/npm/dm/iobroker.nctalk.svg)](https://www.npmjs.com/package/iobroker.nctalk)
![Number of Installations](https://iobroker.live/badges/nctalk-installed.svg)
![Current version in stable repository](https://iobroker.live/badges/nctalk-stable.svg)
[![Dependency Status](https://img.shields.io/david/jjqoie/iobroker.nctalk.svg)](https://david-dm.org/jjqoie/iobroker.nctalk)

[![NPM](https://nodei.co/npm/iobroker.nctalk.png?downloads=true)](https://nodei.co/npm/iobroker.nctalk/)

**Tests:** ![Test and Release](https://github.com/jjqoie/ioBroker.nctalk/workflows/Test%20and%20Release/badge.svg)

## nctalk adapter for ioBroker

Use nextcloud Talk service to communicate with ioBroker, push notification and sending commands to control your smarthome

![Screenshot](img/nctalk-admin.png)
![Screenshot](img/nctalk-objects.png)
![Screenshot](img/nctalk-Push.jpg)


## How to use

### Configuration
- Name - for later use maybe. No need to change it.<br />
- Token - unique id of a talk chatroom (don't change, in the future this column will be made read only)<br />
- Type - talk supports different types of chatrooms "One to one", "Group", "Public", "Changelog". Not used, just additional information for the admin. (don't change)<br />
- iobrokergroup - assigns a talk chatroom to one or multiple iobroker group. Group-Names are sperated by comma ","<br />
- text2command - not implemented yet<br />
- Listen Active - If activated the chatroom will be polled for new messages available.

### Object description
- **nctalk.*i.iobrokergroupname*.LastReceivedMessage** - Shows last received message of this iobrokergroup as string. No queuing mechanism is currently implemented. Means in case two messages arrive almost at the same time only the earlier message might be lost.
- **nctalk.*i.iobrokergroupname*.SendMessage** - Sends string to the every talk chatroom in the same iobrokergroup<br />
- **nctalk.*i.iobrokergroupname*.ShareFile.NextcloudPath** - path to ane existing file in nextcloud for example "/Photos/Birdie.jpg"<br />
- **nctalk.*i.iobrokergroupname*.ShareFile.URL** - Object/JSON with two elements filename = filename to be created and the url to the ressource on the web where to download the file. Example {"filename": "snapshot.jpg", "url": "https://<username>:<password>@192.168.XXX.XXX/cgi-bin/currentpic.cgi"} <br />
- **nctalk.*i.iobrokergroupname*.ShareFile.UploadShareObj** - Object/JSON with two elements filename = filename to be created and Buffer with binary data of the file. Example {"filename": "dafang02.png", "data": {"type": "Buffer","data": [ 255, 216, 255, 224, ....]}}
<br />


### Limitations
No queuing mechanism with handshake (producer/consumer) using the acknowledge function is implemented yet. This can lead to losing messages in case of simultaneously requests. 

### Examples

####  Share existing file using **ShareFile.NextcloudPath**<br/> - string to file path inside the user's root
```
"/Photos/Birdie.jpg"
```

#### Share file from web using **ShareFile.URL**
Allows self signed certificates and simple authentication using username:password@
```js
{"filename": "snapshot.jpg", "url": "https://<username>:<password>@192.168.XXX.XXX/cgi-bin/currentpic.cgi"}
```
#### Blockly example from Karsten using **ShareFile.URL** - https://forum.iobroker.net/topic/49298/neuer-adapter-nextcloud-talk-messenger/53?_=1641974071507
![Screenshot](img/1641868006253-nextcloud_talk_22.png)

#### Share file from local disk using **UploadShareObj**
```js
var fs = require("fs");

fs.readFile("/opt/iobroker/iobroker-data/tmp/dafang01/dafang01.png", null , (err, data) => {
    if (err) {
        console.error(err)
        return
    }

    const fileNextcloud = {
        filename: "tests123.png",
        data: data
    }
    //console.log(fileNextcloud)
    setState("nctalk.0.kjf53yuu.ShareFile.UploadShareObj", fileNextcloud);
})
```

#### Share file from web using **UploadShareObj**
```js
var https = require("https");

var options = {
    host: 'raw.githubusercontent.com',
    port: 443,
    path: '/jjqoie/iobroker.nctalk/main/img/nctalk-objects.png',
    method: 'GET',
};

https.get(options, function(res) {
    res.setEncoding('binary');
    let chunks = [];

    res.on('data', (chunk) => {
        chunks.push(Buffer.from(chunk, 'binary'));
    });

    res.on('end', () => {
        let binary = Buffer.concat(chunks);
        // binary is now a Buffer that can be used as Uint8Array or as
        // any other TypedArray for data processing in NodeJS or 
        // passed on via the Buffer to something else.

        });
        const fileNextcloud = {
            filename: "snapshot.png",
            data: binary
        }
        setState("nctalk.0.grp2.ShareFile.UploadShareObj", fileNextcloud);
    });
});
```

## Changelog
<!--
    Placeholder for the next version (at the beginning of the line):
    ### **WORK IN PROGRESS**
-->
### 0.4.0 (2023-02-23)
* (Jochen Gerster) Fix missing uk translations warning of automated adapter checker

### 0.3.1 (2023-02-23)
* (Jochen Gerster) fix issues found by adapter checker
* (Jochen Gerster) Ensure object id does not contain an invalid character
* (Jochen Gerster) Update to nctalkclient 1.5.0

### 0.3.0 (2022-01-07)
* (Jochen Gerster) Added FileSharing

### 0.2.0 (2021-11-23)
* (Jochen Gerster) Added debug logging option

### 0.1.0 (2021-11-13)
* (Jochen Gerster) initial release

## License
MIT License

Copyright (c) 2023 Jochen Gerster <jjqoie@gmx.de>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
