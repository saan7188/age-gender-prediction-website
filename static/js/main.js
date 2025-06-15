// 📤 Share Result
function shareResult() {
    const img = document.getElementById("result-image").src;
    const age = document.querySelector(".prediction-info p:nth-child(1)").innerText;
    const gender = document.querySelector(".prediction-info p:nth-child(2)").innerText;

    if (navigator.share) {
        navigator.share({
            title: 'Age & Gender Prediction',
            text: ${age}\n${gender},
            url: window.location.href
        }).then(() => showToast("Shared successfully!"))
          .catch(err => showToast("Share canceled."));
    } else {
        showToast("Sharing not supported on this browser.");
    }
}

// 📸 Webcam Capture
function captureSnapshot() {
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('snapshotCanvas');
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(function(blob) {
        const formData = new FormData();
        formData.append('image', blob, 'snapshot.png');
        document.getElementById('live-loader').style.display = 'block';

        fetch('/upload?lang=' + getLang(), {
            method: 'POST',
            body: formData
        })
        .then(res => res.text())
        .then(html => {
            document.open();
            document.write(html);
            document.close();
        })
        .catch(err => {
            alert("Upload failed!");
            console.error(err);
        })
        .finally(() => {
            document.getElementById('live-loader').style.display = 'none';
        });
    }, 'image/png');
}

// 🌐 Language helper
function getLang() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('lang') || 'en';
}

// ✅ Privacy Modal Handling
document.addEventListener("DOMContentLoaded", function () {
    if (!sessionStorage.getItem("privacyAccepted")) {
        document.getElementById("privacyAgreementModal").style.display = "block";
        disableActions();
    }
});

// 👇 Agree to privacy
function agreeToPrivacy() {
    sessionStorage.setItem("privacyAccepted", true);
    document.getElementById("privacyAgreementModal").style.display = "none";
    enableActions();
}

// 👇 Decline privacy
function declinePrivacy() {
    alert("You need to accept the Privacy Agreement to use this app.");
    document.getElementById("privacyAgreementModal").style.display = "block";
    disableActions();
}

// 👇 Disable all interactive buttons
function disableActions() {
    const buttons = document.querySelectorAll("button, a.cta-button");
    buttons.forEach(btn => {
        if (!btn.closest("#privacyAgreementModal")) {
            btn.classList.add("disabled");
            btn.disabled = true;
            btn.dataset.originalOnclick = btn.onclick;
            btn.onclick = (e) => {
                e.preventDefault();
                alert("Please accept the Privacy Agreement first.");
            };
        }
    });
}

// 👇 Enable buttons again
function enableActions() {
    const buttons = document.querySelectorAll("button, a.cta-button");
    buttons.forEach(btn => {
        btn.classList.remove("disabled");
        btn.disabled = false;
        btn.onclick = null;
    });
}

// 🖼 Image Preview on Upload
document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('imageInput');
    const previewImage = document.getElementById('preview-image');
    const previewContainer = document.getElementById('preview-container');

    if (input) {
        input.addEventListener('change', function () {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    previewImage.src = e.target.result;
                    previewContainer.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                previewContainer.style.display = 'none';
            }
        });
    }
});

// 🎥 Init Webcam
if (document.getElementById('webcam')) {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
            document.getElementById('webcam').srcObject = stream;
        })
        .catch(() => showToast("Webcam access denied."));
}

// 💬 Feedback Modal
function openModal() {
    document.getElementById("feedbackModal").style.display = "block";
}
function closeModal() {
    document.getElementById("feedbackModal").style.display = "none";
}
window.onclick = function (e) {
    if (e.target.classList.contains("modal")) {
        closeModal();
    }
}

// ✅ Toast Message
function showToast(msg) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// 🔍 Feedback Filtering
function filterFeedbacks() {
    const rating = document.getElementById("ratingFilter").value;
    const search = document.getElementById("searchBox").value.toLowerCase();
    const cards = document.querySelectorAll(".feedback-card");

    cards.forEach(card => {
        const cardRating = card.dataset.rating;
        const cardComment = card.dataset.comment.toLowerCase();

        const matchesRating = (rating === "all" || cardRating === rating);
        const matchesSearch = cardComment.includes(search);

        card.style.display = matchesRating && matchesSearch ? "block" : "none";
    });
}

// 🛠 Tooltips
document.querySelectorAll('[data-tooltip]').forEach(el => {
    el.addEventListener('mouseenter', () => {
        const tooltip = document.createElement('span');
        tooltip.className = 'tooltip';
        tooltip.innerText = el.dataset.tooltip;
        el.appendChild(tooltip);
    });
    el.addEventListener('mouseleave', () => {
        const tooltip = el.querySelector('.tooltip');
        if (tooltip) tooltip.remove();
    });
});