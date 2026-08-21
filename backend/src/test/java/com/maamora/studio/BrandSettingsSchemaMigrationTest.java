package com.maamora.studio;

import com.maamora.studio.config.BrandSettingsSchemaMigration;
import org.h2.jdbcx.JdbcDataSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.support.DefaultListableBeanFactory;

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
        }

        DefaultListableBeanFactory beanFactory = new DefaultListableBeanFactory();
        beanFactory.registerSingleton("dataSource", dataSource);

        BrandSettingsSchemaMigration migration = new BrandSettingsSchemaMigration();
        migration.postProcessBeanFactory(beanFactory);
        migration.postProcessBeanFactory(beanFactory);

        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery("SELECT configured FROM brand_settings WHERE id = 'legacy-brand'")) {
            assertThat(resultSet.next()).isTrue();
            assertThat(resultSet.getBoolean("configured")).isFalse();
            assertThat(resultSet.wasNull()).isFalse();
        }
    }
}
