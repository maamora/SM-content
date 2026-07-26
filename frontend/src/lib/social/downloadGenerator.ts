export class DownloadGenerator {
    static downloadFile(content: string, platform: string = "social") {
        // Must run in the browser
        if (typeof window === "undefined") {
            return;
        }

        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `generated-post-${platform.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
