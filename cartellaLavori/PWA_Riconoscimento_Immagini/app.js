let model;

const input = document.getElementById("imageInput");
const previewContainer = document.getElementById("previewContainer");

const dogCountEl = document.getElementById("dogCount");
const catCountEl = document.getElementById("catCount");
const unknownCountEl = document.getElementById("unknownCount");

let totalImages = 0;
let dogCount = 0;
let catCount = 0;
let unknownCount = 0;

// Parole chiave migliorate
const dogKeywords = [
    "dog", "puppy",
    "retriever", "labrador", "golden",
    "shepherd", "german shepherd",
    "husky", "malamute",
    "terrier", "bulldog",
    "poodle", "beagle",
    "rottweiler", "doberman",
    "chihuahua", "pug"
];

const catKeywords = [
    "cat",
    "tabby",
    "tiger cat",
    "persian",
    "siamese",
    "egyptian",
    "maine coon",
    "ragdoll",
    "british shorthair"
];

// Carica modello
async function loadModel() {
    model = await mobilenet.load();
    console.log("Modello caricato");
}
loadModel();

// Aggiunta immagini UNA ALLA VOLTA
input.addEventListener("change", async (event) => {
    const files = Array.from(event.target.files);

    for (let file of files) {

        if (totalImages >= 10) {
            alert("Puoi caricare massimo 10 immagini");
            break;
        }

        totalImages++;

        const container = document.createElement("div");
        container.className = "preview-item";

        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);

        const label = document.createElement("div");
        label.className = "label";
        label.textContent = "Analisi...";

        container.appendChild(img);
        container.appendChild(label);
        previewContainer.appendChild(container);

        await new Promise(resolve => {
            img.onload = async () => {
                const predictions = await model.classify(img);

                let result = "unknown";
                let prob = 0;

                for (let p of predictions) {
                    const name = p.className.toLowerCase();

                    if (dogKeywords.some(word => name.includes(word))) {
                        result = "dog";
                        prob = p.probability;
                        break;
                    }

                    if (catKeywords.some(word => name.includes(word))) {
                        result = "cat";
                        prob = p.probability;
                        break;
                    }
                }

                // Aggiorna contatori
                if (result === "dog") {
                    dogCount++;
                    label.textContent = "Cane (" + (prob * 100).toFixed(1) + "%)";
                    label.classList.add("dog");
                }
                else if (result === "cat") {
                    catCount++;
                    label.textContent = "Gatto (" + (prob * 100).toFixed(1) + "%)";
                    label.classList.add("cat");
                }
                else {
                    unknownCount++;
                    label.textContent = "Non riconosciuto";
                    label.classList.add("unknown");
                }

                dogCountEl.textContent = dogCount;
                catCountEl.textContent = catCount;
                unknownCountEl.textContent = unknownCount;

                resolve();
            };
        });
    }

    // Permette di ricaricare lo stesso file
    input.value = "";
});

// Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
}