// update-faqs.js - Update FAQs with GCET Jammu specific information

require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'gcet.sqlite3');
const db = new sqlite3.Database(DB_PATH);

const gcetJammuFAQs = [
  {
    question: 'What is GCET Jammu?',
    answer: 'GCET (Government College of Engineering and Technology) Jammu is a premier engineering institution in Jammu & Kashmir, India. It offers quality technical education with modern infrastructure and experienced faculty. 🎓'
  },
  {
    question: 'Where is GCET Jammu located?',
    answer: 'GCET Jammu is located in Chak Bhalwal, Jammu, Jammu and Kashmir, India. The campus is well-connected and provides excellent facilities for engineering education. 📍'
  },
  {
    question: 'What courses does GCET Jammu offer?',
    answer: 'GCET Jammu offers B.Tech programs in Computer Science & Engineering, Electronics & Communication Engineering, Mechanical Engineering, Civil Engineering, and Electrical Engineering. M.Tech programs are also available in select specializations. 🎯'
  },
  {
    question: 'How can I get admission to GCET Jammu?',
    answer: 'Admissions to GCET Jammu are based on JEE Main scores followed by counseling conducted by the Jammu and Kashmir Common Entrance Test (JKCET) for state quota seats. For detailed information, visit the official college website or contact the admission office. 📝'
  },
  {
    question: 'What is the fee structure?',
    answer: 'As a government institution, GCET Jammu offers affordable education. The fee structure varies by course and category. Contact the college administration or check the official website for current fee details. 💰'
  },
  {
    question: 'Is hostel available at GCET Jammu?',
    answer: 'Yes, GCET Jammu provides separate hostel facilities for boys and girls with all necessary amenities including mess, common rooms, and internet connectivity. 🏠'
  },
  {
    question: 'What facilities are available at GCET Jammu?',
    answer: 'GCET Jammu offers modern laboratories, well-stocked library, computer centers, sports facilities, cafeteria, WiFi connectivity, auditorium, and hostel accommodation. The college focuses on providing comprehensive learning infrastructure! 🏫'
  },
  {
    question: 'What are the placement opportunities?',
    answer: 'GCET Jammu has an active Training & Placement Cell that conducts campus recruitment drives. Reputed companies visit the campus for placements and internships. The college also provides pre-placement training to students. 💼'
  },
  {
    question: 'How many semesters in B.Tech?',
    answer: 'B.Tech programs at GCET Jammu are divided into 8 semesters over 4 years, following the semester system with regular examinations and continuous evaluation. 📚'
  },
  {
    question: 'What is the attendance requirement?',
    answer: 'Students must maintain at least 75% attendance in each subject to be eligible for appearing in semester examinations. This is as per university guidelines. ⚠️'
  },
  {
    question: 'Does GCET Jammu have good labs?',
    answer: 'Yes! GCET Jammu has well-equipped laboratories for all departments including Computer labs, Electronics labs, Mechanical workshops, Civil engineering labs, and Electrical labs with modern equipment and software. 🔬'
  },
  {
    question: 'What about library facilities?',
    answer: 'The GCET Jammu library has an extensive collection of books, journals, magazines, and digital resources. Students have access to online databases, e-books, and research papers for academic enrichment. 📖'
  },
  {
    question: 'Are there any technical clubs?',
    answer: 'Yes! GCET Jammu has various technical clubs, coding clubs, robotics clubs, and student chapters of professional organizations like IEEE, CSI, etc. Students actively participate in workshops, competitions, and technical events. 🤖'
  },
  {
    question: 'What about sports facilities?',
    answer: 'GCET Jammu provides sports facilities including playgrounds for cricket, football, volleyball, basketball courts, and indoor games. The college encourages students to participate in sports and extracurricular activities. ⚽'
  },
  {
    question: 'How is the faculty at GCET Jammu?',
    answer: 'GCET Jammu has experienced and qualified faculty members who are dedicated to providing quality education. Many faculty members hold PhDs and have industry experience, ensuring practical and theoretical learning. 👨‍🏫'
  },
  {
    question: 'What programming languages should I learn for CSE?',
    answer: 'For CSE at GCET Jammu, focus on C, C++, Java, Python for basics. Then learn web technologies (HTML, CSS, JavaScript), databases (SQL), and frameworks. Data structures and algorithms are crucial! 💻'
  },
  {
    question: 'How can I improve my coding skills?',
    answer: 'Practice regularly on platforms like LeetCode, HackerRank, CodeChef, and Codeforces. Work on projects, participate in hackathons, contribute to open-source, and join coding clubs at GCET. Consistency is key! 🚀'
  },
  {
    question: 'When do placements usually start?',
    answer: 'Campus placements at GCET Jammu typically begin in the final year (7th semester onwards). The Training & Placement Cell conducts pre-placement training, mock interviews, and aptitude preparation sessions. 🎯'
  },
  {
    question: 'What are the college timings?',
    answer: 'GCET Jammu typically operates from Monday to Friday. Regular class hours are usually from 9:00 AM to 4:30 PM, though timings may vary by department and semester. ⏰'
  },
  {
    question: 'How do I contact GCET Jammu?',
    answer: 'You can contact GCET Jammu through their official website, email, or by visiting the administrative office at Chak Bhalwal, Jammu. The college office operates during working hours on weekdays. 📞'
  }
];

async function updateFAQs() {
  console.log('🔄 Updating FAQs with GCET Jammu information...');
  
  // Clear existing FAQs
  db.run('DELETE FROM faq', (err) => {
    if (err) {
      console.error('❌ Error clearing FAQs:', err);
      return;
    }
    
    console.log('✅ Cleared existing FAQs');
    
    // Insert new FAQs
    const stmt = db.prepare('INSERT INTO faq (question, answer) VALUES (?, ?)');
    
    let inserted = 0;
    gcetJammuFAQs.forEach((faq, index) => {
      stmt.run(faq.question, faq.answer, (err) => {
        if (err) {
          console.error(`❌ Error inserting FAQ ${index + 1}:`, err);
        } else {
          inserted++;
          if (inserted === gcetJammuFAQs.length) {
            console.log(`✅ Successfully updated ${inserted} GCET Jammu FAQs!`);
            stmt.finalize();
            db.close();
          }
        }
      });
    });
  });
}

updateFAQs();
