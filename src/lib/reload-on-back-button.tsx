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
