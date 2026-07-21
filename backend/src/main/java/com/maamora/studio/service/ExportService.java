package com.maamora.studio.service;

import com.maamora.studio.model.Post;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Packages one or several Posts (image + 3 captions) into a single ZIP,
 * ready to download and paste into Instagram/Facebook/WhatsApp.
 */
@Service
public class ExportService {

    public byte[] buildZip(List<Post> posts) {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        RestClient http = RestClient.create();

        try (ZipOutputStream zip = new ZipOutputStream(buffer)) {
            int i = 1;
            for (Post post : posts) {
                String folder = posts.size() > 1 ? (i++ + "-" + safeName(post.getProduct().getName())) + "/" : "";

                if (post.getImageUrl() != null) {
                    byte[] image = http.get().uri(post.getImageUrl()).retrieve().body(byte[].class);
                    zip.putNextEntry(new ZipEntry(folder + "creative.png"));
                    zip.write(image != null ? image : new byte[0]);
                    zip.closeEntry();
                }

                zip.putNextEntry(new ZipEntry(folder + "caption-en.txt"));
                zip.write(orEmpty(post.getCaptionEn()).getBytes());
                zip.closeEntry();

                zip.putNextEntry(new ZipEntry(folder + "caption-fr.txt"));
                zip.write(orEmpty(post.getCaptionFr()).getBytes());
                zip.closeEntry();

                zip.putNextEntry(new ZipEntry(folder + "caption-ar.txt"));
                zip.write(orEmpty(post.getCaptionAr()).getBytes());
                zip.closeEntry();

                zip.putNextEntry(new ZipEntry(folder + "caption-darija.txt"));
                zip.write(orEmpty(post.getCaptionDarija()).getBytes());
                zip.closeEntry();
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to build export ZIP", e);
        }

        return buffer.toByteArray();
    }

    private String safeName(String name) {
        return name == null ? "product" : name.replaceAll("[^a-zA-Z0-9-]", "-");
    }

    private String orEmpty(String s) {
        return s == null ? "" : s;
    }
}
