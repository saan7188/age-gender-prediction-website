

// 📤 Share Result
function shareResult() {
    const img = document.getElementById("result-image").src;
    const age = document.querySelector(".prediction-info p:nth-child(1)").innerText;
    const gender = document.querySelector(".prediction-info p:nth-child(2)").innerText;

    if (navigator.share) {
        navigator.share({
            title: 'Age & Gender Prediction',
            text: `${age}\n${gender}`,
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

    // Convert canvas to blob and send to backend
    canvas.toBlob(function(blob) {
        const formData = new FormData();
        formData.append('image', blob, 'snapshot.png');

        // Show loader
        document.getElementById('live-loader').style.display = 'block';

        // Send to /upload route
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

// helper to get selected language
function getLang() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('lang') || 'en';
}
// Check if user already agreed
window.addEventListener("DOMContentLoaded", function () {
    if (!sessionStorage.getItem("privacyAccepted")) {
        document.getElementById("privacyAgreementModal").style.display = "block";
    }
});

function agreeToPrivacy() {
    sessionStorage.setItem("privacyAccepted", true);
    document.getElementById("privacyAgreementModal").style.display = "none";
}
function declinePrivacy() {
    alert("You need to accept the Privacy Agreement to use this app.");
    document.getElementById("privacyAgreementModal").style.display = "block";

    // Disable interaction with all buttons and links except modal
    const buttons = document.querySelectorAll("button, a.cta-button");
    buttons.forEach(btn => {
        if (!btn.closest("#privacyAgreementModal")) {
            btn.classList.add("disabled");
            btn.onclick = (e) => {
                e.preventDefault();
                alert("Please accept the Privacy Agreement first.");
            };
        }
    });
}

window.addEventListener("DOMContentLoaded", disableActionsIfNotAgreed);
function disableActionsIfNotAgreed() {
    if (!sessionStorage.getItem("privacyAccepted")) {
        const buttons = document.querySelectorAll("button, a.cta-button");
        buttons.forEach(btn => {
            // Skip the agree button!
            if (!btn.closest("#privacyAgreementModal")) {
                btn.classList.add("disabled");
                btn.onclick = (e) => {
                    e.preventDefault();
                    alert("Please accept the Privacy Agreement first.");
                };
            }
        });
    }
}


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
    if (e.target.className === "modal") {
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
        const cardComment = card.dataset.comment;

        const matchesRating = (rating === "all" || cardRating === rating);
        const matchesSearch = cardComment.includes(search);

        card.style.display = matchesRating && matchesSearch ? "block" : "none";
    });
}

// 🛠️ Tooltip (basic)
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
