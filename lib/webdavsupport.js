
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

        try {
            this.adapter.log.info("CreateUploadPathIfnotExist " + this.config.upload_path);
            if (await this.client.exists(this.config.upload_path) === false) {
                this.adapter.log.info("Create Upload Folder " + this.config.upload_path);
                await this.client.createDirectory(this.config.upload_path);
            }
        }
        catch (e) {
            this.adapter.log.error("CreateUploadPathIfnotExist failed - check url and login configuration");
        }
    }

    async UploadFile(filename, data) {
        return await this.client.putFileContents(this.config.upload_path + "/" + filename, data, { overwrite: this.config.overwrite });
    }

    async LoadFileFromWeb(web, filename, URL) {
        return new Promise(function (resolve) {

            const req = web.get(URL, (function (res) {
                res.setEncoding("binary");
                const chunks = [];

                res.on("error", ((e) => {
                    resolve("error");
                }));

                res.on("data", ((chunk) => {
                    chunks.push(Buffer.from(chunk, "binary"));
                }));

                res.on("end", (() => {
                    const binary = Buffer.concat(chunks);
                    // binary is now a Buffer that can be used as Uint8Array or as
                    // any other TypedArray for data processing in NodeJS or 
                    // passed on via the Buffer to something else.
                    resolve(binary);

                }));

            }));

            req.on("error", ((e) => {
                resolve(false);
            }));

            req.on("timeout", (() => {
                // http timeout - IMPORTANT: socket is still open and can trigger one of the callback aboves!
                // call abort request --> leading to socket hang up error --> No Callback to calling layer here
                req.abort();
            }));
        });
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
            this.adapter.log.error(`Wrong URL format for UploadFileFromURL, ${filename}, ${URL}`);
        }

        if (web != undefined) {

            const result = await this.LoadFileFromWeb(web, filename, URL);

            if (result !== false) {
                return await this.UploadFile(filename, result);
            }
        }

        return false;
    }
}

module.exports = webdavsupport;