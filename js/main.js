let v = $("#flex_main");
let img_disp = $("#img_disp");
let img_scroll = $("#img_scroll");
let slider = $("#slider");
let upload = $("#upload");
let img_flex = $("#img_flex");
let large_elm = $("#large_elm");

let output = $("#output");
let input = $("#txtinput");

let fileInput = document.createElement("input");

let files = [];
let images = {};
let results = {};

let initialized = false;
let instantApplySetting = false;

let important_msg = "";

let selected_img = null;

let keybindings = {};

let localStorage = window.localStorage;

const MAGIC_FUNCS = {
    "#APPLY": "apply_cur_transcription()",
    "#PREV": "prev_image()",
    "#NEXT": "next_image()",
    "#REMOVE": "clear_current()",
    "#CLEARLAST": "clear_last()",
}

/* https://stackoverflow.com/a/7616484 */
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

/* https://stackoverflow.com/a/50772599 */
function downloadTextFile(text, name) {
    const a = document.createElement('a');
    const type = name.split(".").pop();
    a.href = URL.createObjectURL( new Blob([text], { type:`text/${type === "txt" ? "plain" : type}` }) );
    a.download = name;
    a.click();
}

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

    div.onmouseover = () => {display_msg(`${get_img_stats(id)}`)};
    div.onmouseleave = () => {display_msg(important_msg)};

    url = await url;
    img.src = url;

    images[id] = {
        "name": f.name,
        "url": url,
        "class": "unclassified",
        "next": null,
        "prev": null,
    };

    return new Promise((resolve, reject) => {img.onload = resolve; img.onerror = reject;})
}

function get_img_stats(id) {
    return `${images[id].name}: ${images[id].class}`
}

function display_msg(msg) {
    output.text(msg);
}

function image_sel(id) {
    if (selected_img != null && results[images[selected_img].name] === undefined) {
        mark_skipped(selected_img);
    }

    if ($(`#${selected_img}_img`).length != 0) {
        $(`#${selected_img}_div`).removeClass('selected');
    }
    large_elm[0].src = images[id].url;
    display_msg(important_msg = get_img_stats(id));
    selected_img = id;
    $(`#${id}_div`).addClass('selected');

    // make sure selected element is visible
    $(`#${id}_div`)[0].scrollIntoView({behavior: "smooth", block: "center"});
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

    /* handle enter on custom entry */
    input.on('keyup', function (e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
            apply_cur_transcription();
        }
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

    $("#results").click(()=>{downloadTextFile(JSON.stringify(results), 'results.json');});

    $("#recover").click(()=>{downloadTextFile(localStorage.getItem('results'), 'recovered_results.json');});

    $.getJSON("keybindings.json").done(res => {
        keybindings = res;
        update_keybindings();
    }).fail((bad)=>{alert("Cannot parse keybindings!"); console.log(bad);});

    /* make dropdown menu not close immediately */
    $('#options_menu').on('hide.bs.dropdown', function (e) {
        var target = $(e.target);
        if(target.hasClass("keepopen") || target.parents(".keepopen").length){
            return false; // returning false should stop the dropdown from hiding.
        }else{
            return true;
        }
    });
}

function update_keybindings(bind_dict=keybindings) {
    bind_code = {}
    for (const key in bind_dict) {
        if (bind_dict[key][0] == '#') {
            bind_code[key] = `${MAGIC_FUNCS[bind_dict[key]]}`;
        } else if (bind_dict[key][0] == '!') {
            bind_code[key] = `apply_transcription(selected_img, "${bind_dict[key].substring(1)}"); next_image();`;
        } else if (bind_dict[key][0] != '_'){
            bind_code[key] = `if (instantApplySetting) {apply_transcription(selected_img, "${bind_dict[key]}"); next_image();} else {input.val(input.val() + " ${bind_dict[key]}")}`;
        }
    }

    binds = "";
    for (const key in bind_code) {
        binds += `if (key == "${key}"){${bind_code[key]}};`;
    }

    document.onkeydown = function(e){
        if (input[0] === document.activeElement) {return;}
        const key = e.key;
        eval(binds);
    };
}

function add_binding(key, label) {
    keybindings[key] = label;
    update_keybindings();
}

function update_ui() {
    if (files.length || Object.keys(images).length) {
        upload.css("height", "24px");
        $("#upload_icon").css("font-size", "24px");
        img_flex.css("max-height", "calc(100% - 24px)");

        let outs = [];
        for (var i = 0; i < files.length; i++) {
            outs.push(generateIMG(files[i]));
        }

        let first = null;
        Promise.all(outs).then(() => {
            let prev = null;
            let img;
            for (img in images) {
                if (prev != null) {
                    images[prev].next = img;
                    images[img].prev = prev;
                } else {
                    first = img;
                }
                prev = img;
            }
            images[img].next = first;
            images[first].prev = img;

            if (!initialized) {
                initialized = true;
                console.log(first);
                image_sel(first);
            }    
        });

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

function apply_transcription(id, transcription) {
    images[id].class = transcription;
    $(`#${id}_img`)[0].className = 'preview transcribed';
    $(`#${id}_div`)[0].className = 'preview transcribed';
    $(`#${id}_caption`).text(transcription);
    results[images[id].name] = transcription;

    localStorage.setItem('results', JSON.stringify(results));
}

function apply_cur_transcription() {
    const t = input.val();
    if (t != "") {
        apply_transcription(selected_img, t);
        input.val("");
    }
    next_image();
}

function remove_transcription(id) {
    images[id].class = "unclassified";
    $(`#${id}_img`)[0].className = 'preview';
    $(`#${id}_div`)[0].className = 'preview';
    $(`#${id}_caption`).text("");
    delete results[images[id].name];
}

function clear_current() {
    remove_transcription(selected_img);
    image_sel(selected_img);
}

function clear_last() {
    v = input.val()
    input.val(v.substring(0, v.lastIndexOf(" ")));
}

function mark_skipped(id) {
    $(`#${id}_img`)[0].className = 'preview skipped';
    $(`#${id}_div`)[0].className = 'preview skipped';
}

function next_image() {
    image_sel(images[selected_img].next);
}

function prev_image() {
    image_sel(images[selected_img].prev);
}

init_ui()
