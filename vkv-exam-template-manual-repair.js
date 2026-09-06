(()=>{
  'use strict';
  if(document.getElementById('examPrintWrapFix'))return;
  const s=document.createElement('style');s.id='examPrintWrapFix';s.textContent=`
    .majorMatrix,#majorFormattedPreview table,#majorOfficialPrint table{table-layout:fixed!important;width:100%!important;max-width:100%!important}
    .majorMatrix th,.majorMatrix td,#majorFormattedPreview th,#majorFormattedPreview td,#majorOfficialPrint th,#majorOfficialPrint td{white-space:normal!important;overflow:visible!important;overflow-wrap:anywhere!important;word-break:break-word!important;min-width:0!important;max-width:none!important;height:auto!important;vertical-align:middle!important}
    #majorFormattedPreview th *,#majorFormattedPreview td *,#majorOfficialPrint th *,#majorOfficialPrint td *{white-space:normal!important;overflow:visible!important;overflow-wrap:anywhere!important;word-break:break-word!important;min-width:0!important;max-width:100%!important;height:auto!important;box-sizing:border-box!important}
    .majorMatrix select{width:100%!important;min-width:0!important;max-width:100%!important}
    #majorFormattedPreview td,#majorOfficialPrint td{line-height:1.14!important}
    @media print{
      @page{size:A4 landscape;margin:8mm}
      html,body{width:auto!important;height:auto!important;margin:0!important;padding:0!important}
      body.majorExamPrint{background:#fff!important}
      body.majorExamPrint>*:not(#majorOfficialPrint){display:none!important}
      #majorOfficialPrint{display:block!important;width:100%!important;max-width:100%!important;margin:0!important;padding:0!important;overflow:visible!important}
      #majorOfficialPrint .majorPrintSheet{max-width:none!important;width:100%!important;margin:0!important;padding:3mm 4mm 0!important;box-sizing:border-box!important;overflow:visible!important}
      #majorOfficialPrint table{width:100%!important;max-width:100%!important;table-layout:fixed!important;border-collapse:collapse!important}
      #majorOfficialPrint th,#majorOfficialPrint td{font-size:8.6pt!important;line-height:1.12!important;padding:4px 3px!important;white-space:normal!important;overflow:visible!important;overflow-wrap:anywhere!important;word-break:break-word!important;height:auto!important}
      #majorOfficialPrint th *,#majorOfficialPrint td *{white-space:normal!important;overflow:visible!important;overflow-wrap:anywhere!important;word-break:break-word!important;max-width:100%!important;height:auto!important}
      #majorOfficialPrint h1{font-size:18pt!important}
      #majorOfficialPrint h2{font-size:13.5pt!important}
    }
  `;document.head.appendChild(s);
})();