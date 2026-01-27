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

// Additional JavaScript functionalities can be added here - สามารถเพิ่มฟังก์ชัน JavaScript เพิ่มเติมที่นี่