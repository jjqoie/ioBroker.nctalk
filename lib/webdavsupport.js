
const { createClient } = require("webdav");
const http = require("http");
const https = require("https");






class webdavsupport {
    constructor(adapter, config) {
        this.adapter = adapter;
        this.config = config;

        this.url = `${config.protocol}://${config.host}/remote.php/dav/files/${config.user}/`;

        this.client = createClient(
            this.url,
            {
                username: config.user,
                password: config.password
            }
        );

    }

    async CreateUploadPathIfnotExist() {
        this.adapter.log.info("CreateUploadPathIfnotExist " + this.config.upload_path);
        if (await this.client.exists(this.config.upload_path) === false) {
            this.adapter.log.info("Create Upload Folder " + this.config.upload_path);
            await this.client.createDirectory(this.config.upload_path);
        }
    }

    async UploadFile(filename, data) {
        console.log("UploadFile");
        console.log(typeof(data));
        console.log(data);
        return await this.client.putFileContents(this.config.upload_path + "/" + filename, data, { overwrite: this.config.overwrite });
    }

    async UploadFileFromURL(filename, URL) {

        const as = URL.split("/");
        // [
        //     'https:',
        //     '',
        //     'raw.githubusercontent.com',...

        let web = undefined;

        if (as[0] === "https:" && as[1] === "") {
            web = https;
        } else if (as[0] === "http:" && as[1] === "") {
            web = http;
        } else {
            this.adapter.log.error("Check URL format for UploadFileFromURL");
        }

        if (web != undefined) {


            web.get(URL, (function (res) {
                res.setEncoding('binary');
                let chunks = [];

                res.on('data', (chunk) => {
                    chunks.push(Buffer.from(chunk, 'binary'));
                });

                res.on('end', (() => {
                    let binary = Buffer.concat(chunks);
                    // binary is now a Buffer that can be used as Uint8Array or as
                    // any other TypedArray for data processing in NodeJS or 
                    // passed on via the Buffer to something else.
                    this.UploadFile(filename, binary);

                }).bind(this));

            }).bind(this));
        }
    }
}

module.exports = webdavsupport;