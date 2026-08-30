export const ANNUAL_CALENDAR_META = Object.freeze({
  title: 'Annual Calendar 2026-27',
  school: 'Vivekananda Kendra Vidyalaya, Nalbari',
  session: 'Academic Session 2026-27',
  rangeLabel: 'April 2026 - April 2027',
  startDate: '2026-04-01',
  endDate: '2027-04-22',
  subtitle: 'A single, chronological school calendar combining session milestones, examinations, holidays, celebrations, observances, restricted holidays and VKSPV common programmes.'
});

export const ANNUAL_CALENDAR_CATEGORIES = {
  programme:{label:'Programme',color:'var(--programme)'},
  exam:{label:'Examination',color:'var(--exam)'},
  holiday:{label:'Holiday',color:'var(--holiday)'},
  celebration:{label:'Celebration',color:'var(--celebration)'},
  observance:{label:'Observance',color:'var(--observance)'},
  restricted:{label:'Restricted Holiday',color:'var(--restricted)'},
  session:{label:'Session / Vacation',color:'var(--session)'}
};

export const DEFAULT_ANNUAL_CALENDAR_EVENTS = [
  // Session / vacation schedule
  {id:'s01',cat:'session',start:'2026-04-01',end:'2026-04-04',title:'Session Fee Deposit & Distribution of Books',audience:'School community',details:'Deposition of session fee for 2026-27 and distribution of books.'},
  {id:'s02',cat:'session',start:'2026-04-07',end:'2026-04-20',title:'Session Break',audience:'School',details:'Session break before the commencement of the new academic session.'},
  {id:'s03',cat:'session',start:'2026-04-21',title:'Teachers’ Reporting after Session Break',audience:'Teachers'},
  {id:'s04',cat:'session',start:'2026-04-22',title:'Commencement of Classes - Session 2026-27',audience:'Students & staff'},
  {id:'s05',cat:'session',start:'2026-04-30',title:'Commencement of Class XI Classes',audience:'Class XI',dateLabel:'Before 01/05/2026',details:'With provisional admission. The source gives the timing as “Before 01/05/2026”; 30/04/2026 is used only for chronological placement in this digital calendar.'},
  {id:'s06',cat:'session',start:'2026-07-10',end:'2026-07-30',title:'Summer Vacation',audience:'School'},
  {id:'s07',cat:'session',start:'2026-07-30',title:'Teachers’ Reporting for TOC',audience:'Teachers'},
  {id:'s08',cat:'session',start:'2026-07-31',title:'Teachers’ Reporting in Vidyalaya',audience:'Teachers'},
  {id:'s09',cat:'session',start:'2026-08-01',title:'Reopening of School for Students',audience:'Students & staff'},
  {id:'s10',cat:'session',start:'2027-03-23',end:'2027-03-25',title:'Declaration of Result',audience:'School community',details:'Result declaration scheduled between 23/03/2027 and 25/03/2027.'},
  {id:'s11',cat:'session',start:'2027-04-01',end:'2027-04-06',title:'Session Fee Deposit & Distribution of Books',audience:'School community',details:'For transition to the next academic session.'},
  {id:'s12',cat:'session',start:'2027-04-07',end:'2027-04-20',title:'Session Break',audience:'School'},
  {id:'s13',cat:'session',start:'2027-04-21',title:'Teachers’ Reporting after Session Break',audience:'Teachers'},
  {id:'s14',cat:'session',start:'2027-04-22',title:'Commencement of Classes - Session 2027-28',audience:'Students & staff',details:'Transition milestone included in the schedule after the 2026-27 annual examination.'},

  // Examination windows
  {id:'e01',cat:'exam',start:'2026-06-23',end:'2026-07-01',title:'Periodic Test-I / Pre-Mid Test Window',audience:'Classes III-XII',details:'Classes III-V: Periodic Test-I (20 marks). Classes VI-XII: Periodic Test-I / Pre-Mid Test (40 marks).'},
  {id:'e02',cat:'exam',start:'2026-09-15',end:'2026-09-29',title:'Term-I / Mid-Term Examination Window',audience:'Classes III-XII',details:'Classes III-V: Terminal Examination (Term-I), 60 marks. Classes VI-XII: Terminal (Term-I) / Mid-Term Examination, 60/70 marks.'},
  {id:'e03',cat:'exam',start:'2026-11-30',end:'2026-12-07',title:'Periodic Test-II / Post-Mid Test Window',audience:'Classes III-XII',details:'Classes III-V: Periodic Test-II (20 marks). Classes VI-XII: Periodic Test-II / Post-Mid Test (40 marks).'},
  {id:'e04',cat:'exam',start:'2027-02-23',end:'2027-03-10',title:'Term-II / Annual Examination Window',audience:'Classes III-V; VI-IX & XI',details:'Classes III-V: Terminal Examination (Term-II), 60 marks. Classes VI-IX & XI: Terminal (Term-II) / Annual Examination, 60/70 marks. Classes X and XII are excluded from this annual examination entry as printed in the source.'},

  // Holidays
  {id:'h01',cat:'holiday',start:'2026-05-01',title:'Buddha Purnima'},
  {id:'h02',cat:'holiday',start:'2026-05-27',title:'Id-Ul-Zuha'},
  {id:'h03',cat:'holiday',start:'2026-09-17',title:'Vishwakarma Puja'},
  {id:'h04',cat:'holiday',start:'2026-10-16',end:'2026-10-26',title:'Durga Puja & Lakshmi Puja'},
  {id:'h05',cat:'holiday',start:'2026-11-08',end:'2026-11-09',title:'Deepawali & Kali Puja'},
  {id:'h06',cat:'holiday',start:'2026-11-24',title:'Guru Nanak Jayanti'},
  {id:'h07',cat:'holiday',start:'2026-12-25',title:'Christmas Day'},
  {id:'h08',cat:'holiday',start:'2027-01-14',end:'2027-01-17',title:'Makar Sankranti & Magh Bihu'},
  {id:'h09',cat:'holiday',start:'2027-03-06',title:'Maha Shivaratri'},
  {id:'h10',cat:'holiday',start:'2027-03-23',title:'Holi'},

  // Celebrations
  {id:'c01',cat:'celebration',start:'2026-08-15',title:'Independence Day'},
  {id:'c02',cat:'celebration',start:'2026-08-28',title:'Raksha Bandhan'},
  {id:'c03',cat:'celebration',start:'2026-09-05',title:'Teachers’ Day'},
  {id:'c04',cat:'celebration',start:'2026-09-11',title:'Universal Brotherhood Day'},
  {id:'c05',cat:'celebration',start:'2026-09-12',title:'Srimanta Sankardeva Tithi'},
  {id:'c06',cat:'celebration',start:'2026-10-02',title:'Gandhi & Shastri Jayanti'},
  {id:'c07',cat:'celebration',start:'2027-01-12',title:'Swami Vivekananda Jayanti (National Youth Day)'},
  {id:'c08',cat:'celebration',start:'2027-01-26',title:'Republic Day / Rani Gaidinliu Jayanti'},
  {id:'c09',cat:'celebration',start:'2027-02-11',title:'Saraswati Puja'},

  // Observances
  {id:'o01',cat:'observance',start:'2026-05-09',title:'Ravindra Jayanti'},
  {id:'o02',cat:'observance',start:'2026-07-29',title:'Guru Purnima'},
  {id:'o03',cat:'observance',start:'2026-09-01',title:'Madhavdeva Tithi'},
  {id:'o04',cat:'observance',start:'2026-09-04',title:'Janmashtami'},
  {id:'o05',cat:'observance',start:'2026-10-28',title:'Sister Nivedita Jayanti'},
  {id:'o06',cat:'observance',start:'2026-11-19',title:'Sadhana Diwas'},
  {id:'o07',cat:'observance',start:'2026-11-24',title:'Lachit Diwas'},
  {id:'o08',cat:'observance',start:'2026-12-02',title:'Asom Diwas'},
  {id:'o09',cat:'observance',start:'2026-12-20',title:'Gita Jayanti'},
  {id:'o10',cat:'observance',start:'2026-12-22',title:'Sarada Maa Jayanti'},
  {id:'o11',cat:'observance',start:'2026-12-25',end:'2027-01-12',title:'Samartha Bharat Parva'},
  {id:'o12',cat:'observance',start:'2027-01-23',title:'Netaji Jayanti (Parakram Divas)'},

  // Restricted holidays
  {id:'r01',cat:'restricted',start:'2026-10-18',title:'Kati Bihu',details:'Restricted holiday. The source notes that this date falls within the Durga Puja holidays.'},
  {id:'r02',cat:'restricted',start:'2026-11-07',title:'Tokhu Emong',details:'Restricted holiday; subject to selection under VKSPV guidelines.'},
  {id:'r03',cat:'restricted',start:'2026-11-15',title:'Chhath Puja',details:'Restricted holiday; subject to selection under VKSPV guidelines.'},
  {id:'r04',cat:'restricted',start:'2026-11-15',title:'Birsa Munda Jayanti (Gaurav Diwas)',details:'Restricted holiday; subject to selection under VKSPV guidelines.'},
  {id:'r05',cat:'restricted',start:'2027-01-12',title:'Bathow Puja',details:'Restricted holiday; subject to selection under VKSPV guidelines.'},
  {id:'r06',cat:'restricted',start:'2027-01-27',title:'Busu Dima',details:'Restricted holiday; subject to selection under VKSPV guidelines.'},
  {id:'r07',cat:'restricted',start:'2027-01-31',title:'Me-Dam-Me-Phi',details:'Restricted holiday; subject to selection under VKSPV guidelines.'},
  {id:'r08',cat:'restricted',start:'2027-02-03',title:'Ali-Aye-Lingang',details:'Restricted holiday; subject to selection under VKSPV guidelines.'},

  // Common programmes
  {id:'p01',cat:'programme',start:'2026-04-30',title:'Core Team Meeting / Meeting of All RAOs',venue:'VK Assam Prant - Karyalaya, Guwahati',audience:'VKSPV / RAOs',details:'Core Team Meeting of VKSPV, Guwahati and Meeting of All RAOs, VKSPV, Guwahati; scheduled in the 1st half / 2nd half.'},
  {id:'p02',cat:'programme',start:'2026-05-03',end:'2026-05-05',title:'Teachers’ Orientation Camp - Social Science',venue:'VKV Tezpur',audience:'Social Science teachers',reporting:'02/05/2026, evening'},
  {id:'p03',cat:'programme',start:'2026-05-10',end:'2026-05-12',title:'Teachers’ Orientation Camp - Science',venue:'VKV Tinsukia',audience:'Science teachers',reporting:'09/05/2026, evening'},
  {id:'p04',cat:'programme',start:'2026-05-17',end:'2026-05-19',title:'Teachers’ Orientation Camp - Mathematics',venue:'VKV Ramnagar, Silchar',audience:'Mathematics teachers',reporting:'18/05/2026, evening',sourceAlert:'The reporting date printed in the source falls within the programme dates; it has been retained exactly as printed.'},
  {id:'p05',cat:'programme',start:'2026-05-24',end:'2026-05-26',title:'Teachers’ Orientation Camp - Sanskrit',venue:'VKV Nalbari',audience:'Sanskrit teachers',reporting:'23/05/2026, evening'},
  {id:'p06',cat:'programme',start:'2026-05-30',end:'2026-06-01',title:'Teachers’ Orientation Camp - Assamese',venue:'VKV Golaghat',audience:'Assamese teachers',reporting:'29/05/2026, evening'},
  {id:'p07',cat:'programme',start:'2026-06-08',end:'2026-06-12',title:'Vyaktitwa Vikash Shibir for Class VI (Non-Residential PDC)',venue:'Respective Vidyalaya',audience:'Class VI'},
  {id:'p08',cat:'programme',start:'2026-06-13',end:'2026-06-14',title:'Workshop for Head of Vidyalayas - Setting of Question Papers',venue:'Anandalaya Bhawan, Dibrugarh',audience:'Heads of Vidyalayas',reporting:'13/06/2026, morning',details:'Workshop on monitoring of “Setting of Question Papers”.'},
  {id:'p09',cat:'programme',start:'2026-07-04',end:'2026-07-05',title:'Principals’ Meet',venue:'VKV Kajalgaon',audience:'Principals',reporting:'03/07/2026'},
  {id:'p10',cat:'programme',start:'2026-07-06',title:'Core Team Meeting of VKSPV, Guwahati',venue:'VKV Kajalgaon',audience:'Core Team'},
  {id:'p11',cat:'programme',start:'2026-07-31',end:'2026-08-02',title:'Teachers’ Orientation Camp - 12 to 16 Years of Service',venue:'Anandalaya Bhawan, Dibrugarh',audience:'Teachers completing 12-16 years of service as on 01/04/2026',reporting:'30/07/2026, evening'},
  {id:'p12',cat:'programme',start:'2026-10-10',title:'Core Team Meeting / Meeting of All RAOs',venue:'VKV Dibrugarh',audience:'VKSPV / RAOs',details:'Core Team Meeting of VKSPV, Guwahati and Meeting of All RAOs, VKSPV, Guwahati; scheduled in the 1st half / 2nd half.'},
  {id:'p13',cat:'programme',start:'2026-10-28',title:'Bhagini Nivedita Nibandha Lekhan Spardha',venue:'Respective Vidyalaya',audience:'Students',details:'Essay Writing Competition.'},
  {id:'p14',cat:'programme',start:'2026-11-22',end:'2026-11-25',title:'Ganit Prajna Samvardhan (GPS for Achievers)',venue:'VKV Golaghat',audience:'Selected achievers'},
  {id:'p15',cat:'programme',start:'2026-12-10',end:'2026-12-12',title:'Chote Scientist Workshop for Selected Students',venue:'VKV Tinsukia',audience:'Selected students'},
  {id:'p16',cat:'programme',start:'2026-12-15',title:'Gita Jnana Yajna',venue:'VKV Tingrai',audience:'Participants',details:'Gita Chanting Competition.'},
  {id:'p17',cat:'programme',start:'2026-12-17',title:'Core Team Meeting of VKSPV, Guwahati',venue:'VK Assam Prant - Karyalaya, Guwahati',audience:'Core Team'},
  {id:'p18a',cat:'programme',start:'2027-01-20',end:'2027-01-21',title:'Half-Yearly Principals’ Meet - Cluster 1',venue:'VKV (NEEPCO) Bokuloni',audience:'Principals',details:'Cluster: Tinsukia, Dibrugarh, Bokuloni, Baragolai, Dhemaji, Tingrai, Sivasagar, Sadiya, Sissiborgaon.'},
  {id:'p18b',cat:'programme',start:'2027-01-23',end:'2027-01-24',title:'Half-Yearly Principals’ Meet - Cluster 2',venue:'VKV (NEEPCO) Doyang',audience:'Principals',details:'Cluster: Golaghat, Doyang, Majuli, Nayabazar, Khakthati, Bokakhat.'},
  {id:'p18c',cat:'programme',start:'2027-01-27',end:'2027-01-28',title:'Half-Yearly Principals’ Meet - Cluster 3',venue:'VKV (NEEPCO) Umrangso',audience:'Principals',details:'Cluster: Umrangso, RN Silchar, Badarpur, Borojalenga, Tumpeng, Jirkending.'},
  {id:'p18d',cat:'programme',start:'2027-01-29',end:'2027-01-30',title:'Half-Yearly Principals’ Meet - Nalbari Cluster',venue:'VKV Suklai',audience:'Principals',details:'Cluster: Nalbari, Kajalgaon, Suklai, Tezpur, Mangaldoi.'},
  {id:'p19',cat:'programme',start:'2027-02-01',title:'Core Team Meeting of VKSPV, Guwahati',venue:'VK Assam Prant - Karyalaya, Guwahati',audience:'Core Team'},
  {id:'p20',cat:'programme',start:'2027-03-07',title:'RAO Meeting of VKSPV, Guwahati',venue:'Anandalaya Bhawan, Dibrugarh',audience:'RAOs'}
].sort((a,b)=>a.start.localeCompare(b.start) || a.title.localeCompare(b.title));
