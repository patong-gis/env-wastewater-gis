// Go to Top Button functionality - ฟังก์ชันปุ่มกลับไปด้านบนของหน้า
const goToTopBtn = document.getElementById('goToTopBtn');

// Show or hide the button based on scroll position - แสดงหรือซ่อนปุ่มตามตำแหน่งการเลื่อนหน้า
window.addEventListener('scroll', function() {
    if (window.pageYOffset > 300) {
        goToTopBtn.classList.add('show');
    } else {
        goToTopBtn.classList.remove('show');
    }
});

// Scroll to top smoothly when the button is clicked - เลื่อนกลับไปด้านบนอย่างนุ่มนวลเมื่อปุ่มถูกคลิก
goToTopBtn.addEventListener('click', function() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Toggle More/Less Content functionality - ฟังก์ชันสลับการแสดงเนื้อหาเพิ่มเติม/น้อยลง
function toggleContent(pp) {
    const p2 = document.getElementById(pp);
    const icon = document.getElementById("toggleIcon");

    if (p2.style.display === "none") {
        p2.style.display = "block";
        // Change to 'Up' icon
        icon.classList.remove("fa-circle-chevron-down");
        icon.classList.add("fa-circle-chevron-up");
    } else {
        p2.style.display = "none";
        // Change back to 'Down' icon
        icon.classList.remove("fa-circle-chevron-up");
        icon.classList.add("fa-circle-chevron-down");
    }
}

// Additional JavaScript functionalities can be added here - สามารถเพิ่มฟังก์ชัน JavaScript เพิ่มเติมที่นี่