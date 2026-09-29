/*
 * TaiyangNews newsletter page shell (header, social icons, footer).
 * Copied from the reference 23Sep.html; the dynamic parts are injected by page().
 */
(function (root) {
  'use strict';

  const IMG = 'https://taiyang-news.info/top-module/resources/img';
  const P12 = 'font-family:Arial,sans-serif;font-size:12px;color:#000000;line-height:16px;margin:0;padding:0;';
  const SPACER = `<td valign="top" width="14"><img src="${IMG}/sw(1).jpg" width="14" height="1" border="0" style="display:block;" alt=""></td>`;

  function icon(href, file, alt) {
    return `<td valign="top" width="32"><a href="${href}" target="_blank"><img src="${IMG}/${file}" width="32" height="32" border="0" style="display:block;" alt="${alt}"></a></td>`;
  }

  const STYLE = `
body{font-family: "Muli", -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell',
  'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;line-height: 1.6rem;}
.list-item {margin: 20px 0 0 0 !important;padding: 0;}
.list-item li, .list-item li a, .list-item li h2 {margin: 0 !important; padding: 0; list-style: none;}
.list-item li {margin: 0; padding: 0 0 10px;}
.list-item3 li {display: inline-block; width: 48%;margin-right: 2% !important;}
.list-item4 li {width: 100%;}
.list-item li a {text-decoration: none;}
.list-item li h2, .list-item li a h2 {font-weight: 400;color: #003365;text-decoration: none;font-size: 17px;display: contents;}
.list-item3 li a h2, .list-item4 li a h2{display:block;margin-top:10px !important;}
.list-item li a h2::before {content: "►";color: #003365;margin-right: 10px;text-decoration: none;}
.list-item2 li {margin-bottom: 10px !important;}
.items .item {display: flex;text-decoration: none;margin-bottom: 40px;}
.items .item .image {border-radius: 5px;width: 103px;height: 55px;}
.items .item .details {padding-left: 30px;}
.items .item .details .title { margin:0;padding:0 0 10px 0;color:#003365;font-size:17px;text-decoration:none;display:flex; }
.items .item .details .category, .items .item .details .category a { margin: 0; color: #003365;}
.items .item .details .date {display: block;color: #000;font-size: 14px;font-weight: 500;padding-top: 10px;}
.items .item .details .description {color: #000;font-size: 15px;margin: 0;padding: 5px 0;}
.items .item3 .image {border-radius: 5px;max-width: 330px;height: 210px;}
.items .item4 .image {border-radius: 5px;max-width: 100%;height: 429px;}
`;

  function page({ dateLabel, summary, body }) {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,minimum-scale=1">
<title>TaiyangNews | Newsletter - ${dateLabel}</title>
<style>${STYLE}</style>
</head>
<body style="background-color: #FFFFFF;margin: 0;box-sizing: border-box;font-family: system-ui, Roboto, Helvetica, Arial, sans-serif;font-size: 16px;">
<table cellpadding="0" cellspacing="0" width="100%" bgcolor="#ffffff" style="background:#ffffff;" border="0">
    <tbody>
	<tr>
      <td>
        <table cellpadding="0" cellspacing="0" width="770" border="0" align="center">
			<tbody>
			<tr>
				<td valign="top" width="750">
    <main class="items" style="display: flex;flex-flow: column;align-items: flex-start;margin: 0 auto;padding: 0 15px;">
        <table cellpadding="0" cellspacing="0" width="100%" bgcolor="#cd052a" style="background:#cd052a;" border="0">
            <tbody>
                <tr>
                    <td valign="top" width="300"><img src="https://taiyang-news.info/wp-content/uploads/2024/01/TYN-logo-22022.webp" width="300" border="0" style="display:block;" alt="Taiyang Newsletter - All about solar power"></td>
                    <td valign="top" width="280">
                        <table cellpadding="0" cellspacing="0" width="100%" border="0">
                            <tbody><tr>
                                <td valign="top" align="right">
                                    <p style="font-family:Arial,sans-serif;font-size:17px;color:#ffffff;line-height:20px;margin:0 25px 0 0;padding:0;"><br><br>${dateLabel}</p>
                                </td>
                            </tr>
                        </tbody></table>
                    </td>
                </tr>
            </tbody>
        </table>
		<br />
        <table cellpadding="0" cellspacing="0" width="100%" border="0">
            <tbody>
                <tr>
                    <td valign="middle">
                        <p style="font-family:Arial,sans-serif;font-size:18px;color:#cc052a;line-height:22px;margin:0;padding:0;">SUMMARY OF THE DAY</p>
                    </td>
                    <td valign="top" width="75">
                        <table cellpadding="0" cellspacing="0" width="60%" border="0">
                            <tbody><tr>
                                ${icon('https://twitter.com/taiyangnews', 'ico-tw-big.jpg', 'Twitter')}
                                ${SPACER}
                                ${icon('https://www.youtube.com/TaiyangNewsAllAboutSolar', 'ico-yt-big.jpg', 'YouTube')}
                                ${SPACER}
                                ${icon('http://www.linkedin.com/company/taiyangnews', 'ico-in-big.jpg', 'Linkedin')}
                                ${SPACER}
                                ${icon('https://www.facebook.com/taiyangnews', 'ico-fb-big.jpg', 'Facebook')}
                                ${SPACER}
                            </tr></tbody>
                        </table>
                    </td>
                </tr>
				<tr><td colspan="2"><p class="description" style="font-size:17px">${summary}</p></td></tr>
            </tbody>
        </table>

        <p style="font-family:Arial,sans-serif;font-size:18px;color:#cc052a;line-height:22px;margin:0;padding:0;">NEWSLETTER STORIES HEADLINES</p>

        ${body}<table cellpadding="0" cellspacing="0" width="100%" border="0">
            <tbody>
            <tr>
                <td valign="top"><img src="${IMG}/sw.jpg" width="20" height="1" border="0" style="display:block;" alt="">
                    <p style="${P12}">
                    The TAIYANG DAILY NEWSLETTER is a compilation of the news stories published each working day on the TaiyangNews website. If you like to receive all articles published on our website, we recommend to subscribe for our Newsletter on Website. Please follow us on <a href="https://www.youtube.com/TaiyangNewsAllAboutSolar">YouTube</a>,<a href="https://twitter.com/taiyangnews">Twitter</a>, <a href="http://www.linkedin.com/company/taiyangnews">LinkedIn</a>, <a href="https://www.facebook.com/TaiyangNews/">Facebook</a> and <a href="https://www.instagram.com/TaiyangNews">Instagram</a>.</p>

                    <table cellpadding="0" cellspacing="0" width="100%" border="0">
                        <tbody><tr><td valign="top"><img src="${IMG}/sw.jpg" width="1" height="15" border="0" style="display:block;" alt=""></td></tr>
                        <tr>
                            <td valign="top" width="260">
                                <p style="${P12}">
                                    Where to find and contact us:</p>
                                <table cellpadding="0" cellspacing="0" border="0">
                                    <tbody><tr><td valign="top"><img src="${IMG}/sw(1).jpg" width="1" height="15" border="0" style="display:block;" alt=""></td></tr>
                                    <tr>
                                        ${icon('https://twitter.com/taiyangnews', 'ico-tw-big.jpg', 'Twitter')}
                                        ${SPACER}
                                        ${icon('http://www.linkedin.com/company/taiyangnews', 'ico-in-big.jpg', 'LinkedIn')}
                                        ${SPACER}
                                        ${icon('https://www.youtube.com/TaiyangNewsAllAboutSolar', 'ico-yt-big.jpg', 'YouTube')}
                                        ${SPACER}
                                        ${icon('https://www.facebook.com/taiyangnews', 'ico-fb-big.jpg', 'Facebook')}
                                        ${SPACER}
                                    </tr>
                                </tbody></table>
                            </td>
                            <td valign="top" width="300">
                                <p style="${P12}">
                                You are getting this email because you signed up at our website <a href="https://www.taiyangnews.info/">www.taiyangnews.info</a> or at a solar conference/exhibition. </p>
                                <p style="${P12}">&nbsp;</p>
                                <p style="${P12}">We have updated our Privacy Policy in-line with the GDPR and adapted our mailing list accordingly. If you are unintentionally receiving this newsletter, please click the unsubscribe  button. </p></td>
                        </tr>
                    </tbody></table>
                    </td>
                <td valign="top" width="20"><img src="${IMG}/sw.jpg" width="20" height="1" border="0" style="display:block;" alt=""></td>
            </tr>
            </tbody>
        </table>

        <table cellpadding="15" cellspacing="0" border="0" width="100%" style="background:#cd052a;">
            <tbody>
            <tr>
                <td valign="top">
                    <p style="font-family:Arial,sans-serif;font-size:16px;color:#ffffff;line-height:16px;margin:0;padding:0;">
                        &copy;TaiyangNews ${dateLabel.slice(-4)}, All rights reserved
                    </p>
                </td>
            </tr>
            </tbody>
        </table>

    </main>
				</td>
			</tr>
			</tbody>
		</table>
		</td>
	</tr>
	</tbody>
</table>
</body>
</html>`;
  }

  const api = { page };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TNTemplate = api;
})(typeof window !== 'undefined' ? window : globalThis);
