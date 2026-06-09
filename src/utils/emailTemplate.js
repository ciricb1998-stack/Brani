export function buildBrandedEmail(body, { recipientName = '', subject = '' } = {}) {
  // Strip any HTML tags Claude might have included — we build our own template
  const plainText = body.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')

  const htmlBody = plainText
    .split('\n')
    .map(line => {
      const trimmed = line.trim()
      if (!trimmed) return '<div style="height:12px"></div>'
      return `<p style="margin:0 0 6px 0;line-height:1.75;color:#1e293b;font-size:15px">${trimmed}</p>`
    })
    .join('\n')

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e40af 0%,#2563eb 100%);border-radius:14px 14px 0 0;padding:28px 36px">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display:inline-block;width:44px;height:44px;background:rgba(255,255,255,0.15);border-radius:12px;text-align:center;line-height:44px;font-size:18px;font-weight:900;color:#fff;letter-spacing:-1px;vertical-align:middle">B</div>
                    <div style="display:inline-block;vertical-align:middle;margin-left:12px">
                      <div style="font-size:16px;font-weight:800;color:#ffffff;letter-spacing:0.5px">BRANI Digitale Lösungen</div>
                      <div style="font-size:11px;color:rgba(255,255,255,0.65);letter-spacing:1.5px;margin-top:2px">IT · DIGITALISIERUNG · GESUNDHEITSWESEN</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:#ffffff;padding:36px 36px 28px">
              ${htmlBody}
            </td>
          </tr>

          <!-- SIGNATURE -->
          <tr>
            <td style="background:#f8fafc;border-top:2px solid #2563eb;padding:24px 36px">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size:15px;font-weight:700;color:#1e293b">Branislav Ćirić</div>
                    <div style="font-size:13px;color:#2563eb;font-weight:600;margin-top:3px">BRANI Digitale Lösungen</div>
                    <div style="margin-top:10px;font-size:12px;color:#64748b;line-height:1.8">
                      <span>📧 ciricb1998@gmail.com</span><br/>
                      <span>🌐 IT · Cybersecurity · NIS2 · DSGVO</span><br/>
                      <span>📍 Deutschland</span>
                    </div>
                  </td>
                  <td align="right" valign="top">
                    <div style="width:52px;height:52px;background:linear-gradient(135deg,#1e40af,#2563eb);border-radius:12px;text-align:center;line-height:52px;font-size:22px;font-weight:900;color:#fff">B</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#1e293b;border-radius:0 0 14px 14px;padding:16px 36px;text-align:center">
              <div style="font-size:11px;color:rgba(255,255,255,0.35);letter-spacing:1px">
                BRANI Digitale Lösungen · Professionelle IT-Lösungen für das Gesundheitswesen
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function emailToPdfBlob(htmlContent, subject) {
  return new Promise(resolve => {
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;height:1123px;border:none'
    document.body.appendChild(iframe)
    iframe.srcdoc = htmlContent

    iframe.onload = async () => {
      try {
        const { default: html2canvas } = await import('html2canvas')
        const canvas = await html2canvas(iframe.contentDocument.body, {
          scale: 2, useCORS: true, backgroundColor: '#f1f5f9',
          width: 794, windowWidth: 794,
        })
        const { jsPDF } = await import('jspdf')
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' })
        const pxW = pdf.internal.pageSize.getWidth()
        const pxH = (canvas.height * pxW) / canvas.width
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pxW, pxH)
        resolve(pdf.output('blob'))
      } catch (e) {
        console.error('PDF error:', e)
        resolve(null)
      } finally {
        document.body.removeChild(iframe)
      }
    }
  })
}
