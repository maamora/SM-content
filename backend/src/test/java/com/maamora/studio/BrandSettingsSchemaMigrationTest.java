package com.maamora.studio;

import com.maamora.studio.config.BrandSettingsSchemaMigration;
import java.util.Map;
import org.h2.jdbcx.JdbcDataSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.support.DefaultListableBeanFactory;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

import static org.assertj.core.api.Assertions.assertThat;

class BrandSettingsSchemaMigrationTest {

    @Test
    void upgradesPopulatedLegacyBrandSettingsWithoutNullConfiguredValues() throws Exception {
        JdbcDataSource dataSource = new JdbcDataSource();
        dataSource.setURL("jdbc:h2:mem:brand-schema-upgrade;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE");
        dataSource.setUser("sa");

        try (Connection connection = dataSource.getConnection(); Statement statement = connection.createStatement()) {
            statement.execute("CREATE TABLE brand_settings (id VARCHAR(36) PRIMARY KEY, name VARCHAR(255) NOT NULL)");
            statement.execute("INSERT INTO brand_settings (id, name) VALUES ('legacy-brand', 'Existing workspace')");
            statement.execute("CREATE TABLE post (id VARCHAR(36) PRIMARY KEY)");
        }

        BrandSettingsSchemaMigration migration = new BrandSettingsSchemaMigration();
        StandardEnvironment environment = new StandardEnvironment();
        environment.getPropertySources().addFirst(new MapPropertySource("testDatasource", Map.of(
                "spring.datasource.url", "jdbc:h2:mem:brand-schema-upgrade;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
                "spring.datasource.username", "sa",
                "spring.datasource.password", "",
                "spring.datasource.driver-class-name", "org.h2.Driver"
        )));
        migration.setEnvironment(environment);

        DefaultListableBeanFactory beanFactory = new DefaultListableBeanFactory();
        migration.postProcessBeanFactory(beanFactory);
        migration.postProcessBeanFactory(beanFactory);

        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery("SELECT configured FROM brand_settings WHERE id = 'legacy-brand'")) {
            assertThat(resultSet.next()).isTrue();
            assertThat(resultSet.getBoolean("configured")).isFalse();
            assertThat(resultSet.wasNull()).isFalse();
        }
        try (Connection connection = dataSource.getConnection();
             ResultSet columns = connection.getMetaData().getColumns(null, null, "post", "headline")) {
            assertThat(columns.next()).isTrue();
        }
    }
}
