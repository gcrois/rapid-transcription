let v = $("#flex_main");
let img_disp = $("#img_disp");
let img_scroll = $("#img_scroll");
let slider = $("#slider");
let upload = $("#upload");
let img_flex = $("#img_flex");
let large_elm = $("#large_elm");

let fileInput = document.createElement("input");

let files = [];
let images = {};
let results = {};

let selected_img = null;

String.prototype.hashCode = function() {
    var hash = 0, i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
        chr   = this.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

function preventDefault(e) {
	e.preventDefault();
  	e.stopPropagation();
}

function handleDrop(e) {
    handleFiles(e.dataTransfer.files);
}

function handleFiles(f) {
    files.push(...f);
    update_ui();
}

async function generateURL(f) {
    let reader = new FileReader();
    reader.readAsDataURL(f);
    return new Promise ((resolve, reject) => {
        reader.onload = () => {resolve(reader.result);};
        reader.onerror = e => {reject(); console.log(e);};
    })
}

async function generateIMG(f) {
    let url = generateURL(f);
    let id = `i_${(f.name.hashCode() % (2 ** 30) >>> 0).toString(16)}`;

    let div = document.createElement("div");
    div.setAttribute('id', `${id}_div`);
    div.setAttribute('class', 'preview');
    let img = document.createElement("img");
    img.setAttribute('id', `${id}_img`);
    img.setAttribute('class', 'preview');
    img.onclick = () => {image_sel(id);}
    let caption = document.createElement("div");
    caption.setAttribute('id', `${id}_caption`);
    caption.setAttribute('class', 'caption');

    div.appendChild(img);
    div.appendChild(caption);
    img_flex[0].appendChild(div);

    url = await url;

    img.src = url;

    images[id] = {
        "name": f.name,
        "url": url,
        "class": "unclassified",
    };
}

function image_sel(id) {
    large_elm[0].src = images[id].url;
}

function init_ui() {
    Split({
        columnGutters: [{
            track: 1,
            element: slider[0],
        }],
        minSize: 64,
    });

    /* setup file input */
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.multiple = true;
    upload.click(function() {
        fileInput.click();
    });

    fileInput.addEventListener("change", function() {
        handleFiles(fileInput.files);
    });

    const no_drag = (e) => {
        e.addEventListener('dragenter', preventDefault, false);
        e.addEventListener('dragleave', preventDefault, false);
        e.addEventListener('dragover', preventDefault, false);
        e.addEventListener('drop', preventDefault, false);
    }

    no_drag(img_scroll[0]);
    no_drag($("body")[0]);

    img_scroll[0].addEventListener('drop', handleDrop, false);
}

function update_ui() {
    if (files.length || images.length) {
        upload.css("height", "24px");
        $("#upload_icon").css("font-size", "24px");
        img_flex.css("max-height", "calc(100% - 24px)");

        for (var i = 0; i < files.length; i++) {
            generateIMG(files[i]);
        }

        files = [];
    } else {
        img_flex.css("max-height", "0%");
        upload.css("height", "100%");
        $("#upload_icon").css("font-size", "64px");
    }
}

function reset_ui() {
    alert("This feature has been disabled for your safety...");
    if (false) {
        files = [];
        update_ui();
    }
}

init_ui()
