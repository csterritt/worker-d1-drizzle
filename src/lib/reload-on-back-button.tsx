/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

export const reloadOnBackButton = () => {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
            const observer = new PerformanceObserver((list) => {
              list.getEntries().forEach((entry) => {
               if (entry.type === "back_forward") {
                 window.location.reload();
               }
              });
            });

            observer.observe({ type: "navigation", buffered: true });
          `,
      }}
    ></script>
  )
}
