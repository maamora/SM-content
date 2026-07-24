package com.maamora.studio.service;

import com.maamora.studio.model.Product;
import com.maamora.studio.model.Template;
import com.microsoft.playwright.*;
import com.microsoft.playwright.options.ScreenshotType;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
public class ImageRenderService {

    private static final int SQUARE_SIZE = 1080;
    private static final int STORY_WIDTH = 1080;
    private static final int STORY_HEIGHT = 1920;

    private Playwright playwright;
    private Browser browser;

    @PostConstruct
    void init() {
        playwright = Playwright.create();
        browser = playwright.chromium().launch(
                new BrowserType.LaunchOptions().setArgs(List.of("--no-sandbox")).setHeadless(true)
        );
    }

    @PreDestroy
    void shutdown() {
        if (browser != null) browser.close();
        if (playwright != null) playwright.close();
    }

    public byte[] renderToPng(Template template, Product product, String badgeText, String promoText, String accentColor) {
        String html = loadAndFillTemplate(template, product, badgeText, promoText, accentColor);

        boolean tall = template.getFormat().name().equals("STORY") || template.getFormat().name().equals("WHATSAPP_STATUS");
        int width = tall ? STORY_WIDTH : SQUARE_SIZE;
        int height = tall ? STORY_HEIGHT : SQUARE_SIZE;

        try (BrowserContext context = browser.newContext(
                new Browser.NewContextOptions().setViewportSize(width, height))) {
            Page page = context.newPage();
            page.setContent(html);
            page.waitForLoadState();
            return page.screenshot(new Page.ScreenshotOptions().setType(ScreenshotType.PNG));
        }
    }

    private String loadAndFillTemplate(Template template, Product product, String badgeText, String promoText, String accentColor) {
        try (InputStream in = new ClassPathResource("creative-templates/" + template.getHtmlPath()).getInputStream()) {
            String html = new String(in.readAllBytes(), StandardCharsets.UTF_8);
            return html
                    .replace("{{productName}}", nullToEmpty(product.getName()))
                    .replace("{{productImage}}", nullToEmpty(product.getImageUrl()))
                    .replace("{{price}}", product.getPrice() != null ? product.getPrice() + " MAD" : "")
                    .replace("{{badgeText}}", nullToEmpty(badgeText))
                    .replace("{{promoText}}", nullToEmpty(promoText))
                    .replace("{{accentColor}}", accentColor != null ? accentColor : "#f97316");
        } catch (IOException e) {
            throw new RuntimeException("Could not load template file: " + template.getHtmlPath(), e);
        }
    }

    private String nullToEmpty(String s) {
        return s == null ? "" : s;
    }
}
