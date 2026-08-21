package com.maamora.studio;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

class WindowsBackendLauncherContractTest {

    @Test
    void passesTheRuntimePropertiesLocationAsASpringBootJvmArgument() throws IOException {
        String launcher = Files.readString(Path.of("Start-StudioBackend.ps1"));

        assertThat(launcher)
                .contains("$configLocations = \"classpath:/application.yml,$runtimeConfigLocation\"")
                .contains("$jvmArguments = @(")
                .contains("-Dspring.config.location=$configLocations")
                .contains("-Dspring.datasource.url=$dataSourceUrl")
                .contains("-Dspring.datasource.username=$dataSourceUsername")
                .contains("-Dspring.datasource.password=$dataSourcePassword")
                .contains("-Dspring-boot.run.jvmArguments=$jvmArguments")
                .contains("& .\\mvnw.cmd \"-Dspring-boot.run.jvmArguments=$jvmArguments\" spring-boot:run")
                .contains("foreach ($entry in $settings.GetEnumerator())")
                .contains("$runtimeProperties.Add(\"$($entry.Key)=$(ConvertTo-PropertiesValue $entry.Value)\")")
                .contains("$runtimeProperties.Add(\"$(ConvertTo-ConventionalPropertyName $entry.Key)=$(ConvertTo-PropertiesValue $entry.Value)\")")
                .contains("\"JWT_SECRET\" = @(\"app.jwt.secret\")")
                .contains("spring.datasource.url=$(ConvertTo-PropertiesValue $dataSourceUrl)")
                .contains("Remove-Item -LiteralPath $runtimeConfigDirectory -Recurse -Force -ErrorAction SilentlyContinue");
    }
}
