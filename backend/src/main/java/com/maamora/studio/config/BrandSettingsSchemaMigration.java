package com.maamora.studio.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.context.EnvironmentAware;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Repairs databases created before BrandSettings gained the configured flag.
 *
 * Hibernate cannot add a non-null column to a populated PostgreSQL table in one
 * step because the existing rows would be null. This runs before JPA starts,
 * making the upgrade safe and repeatable for existing workspaces.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Slf4j
public class BrandSettingsSchemaMigration implements BeanFactoryPostProcessor, EnvironmentAware {

    private static final String TABLE_NAME = "brand_settings";
    private static final String COLUMN_NAME = "configured";
    private Environment environment;

    @Override
    public void setEnvironment(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {
        String url = requiredProperty("spring.datasource.url");
        String username = requiredProperty("spring.datasource.username");
        String password = environment.getProperty("spring.datasource.password", "");
        String driverClassName = environment.getProperty("spring.datasource.driver-class-name", "org.postgresql.Driver");

        try {
            Class.forName(driverClassName);
        } catch (ClassNotFoundException exception) {
            throw new IllegalStateException("Unable to load the configured datasource driver " + driverClassName, exception);
        }

        try (Connection connection = DriverManager.getConnection(url, username, password)) {
            try (Statement statement = connection.createStatement()) {
                if (tableExists(connection, TABLE_NAME) && !columnExists(connection, TABLE_NAME, COLUMN_NAME)) {
                    statement.execute("ALTER TABLE brand_settings ADD COLUMN configured BOOLEAN DEFAULT FALSE");
                    log.info("Added missing brand_settings.configured column for existing workspace data");
                }
                if (tableExists(connection, TABLE_NAME)) {
                    statement.executeUpdate("UPDATE brand_settings SET configured = FALSE WHERE configured IS NULL");
                    statement.execute("ALTER TABLE brand_settings ALTER COLUMN configured SET DEFAULT FALSE");
                    statement.execute("ALTER TABLE brand_settings ALTER COLUMN configured SET NOT NULL");
                }
                addPostCampaignColumns(connection, statement);
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Unable to repair brand_settings configured-column schema", exception);
        }
    }

    private String requiredProperty(String propertyName) {
        if (environment == null) {
            throw new IllegalStateException("Spring Environment was unavailable while preparing the brand settings schema migration");
        }
        String value = environment.getProperty(propertyName);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Missing required datasource property " + propertyName + " for the brand settings schema migration");
        }
        return value;
    }

    private void addPostCampaignColumns(Connection connection, Statement statement) throws SQLException {
        if (!tableExists(connection, "post")) return;
        addColumnIfMissing(connection, statement, "headline", "VARCHAR(160)");
        addColumnIfMissing(connection, statement, "supporting_text", "VARCHAR(360)");
        addColumnIfMissing(connection, statement, "cta_text", "VARCHAR(120)");
        addColumnIfMissing(connection, statement, "layout_style", "VARCHAR(32)");
        addColumnIfMissing(connection, statement, "product_focus", "VARCHAR(32)");
        addColumnIfMissing(connection, statement, "text_alignment", "VARCHAR(16)");
    }

    private void addColumnIfMissing(Connection connection, Statement statement, String column, String definition) throws SQLException {
        if (!columnExists(connection, "post", column)) {
            statement.execute("ALTER TABLE post ADD COLUMN " + column + " " + definition);
            log.info("Added missing post.{} campaign context column for existing drafts", column);
        }
    }

    private boolean tableExists(Connection connection, String tableName) throws SQLException {
        DatabaseMetaData metadata = connection.getMetaData();
        try (ResultSet tables = metadata.getTables(connection.getCatalog(), null, "%", new String[]{"TABLE"})) {
            while (tables.next()) {
                if (tableName.equalsIgnoreCase(tables.getString("TABLE_NAME"))) {
                    return true;
                }
            }
        }
        return false;
    }

    private boolean columnExists(Connection connection, String tableName, String columnName) throws SQLException {
        DatabaseMetaData metadata = connection.getMetaData();
        try (ResultSet columns = metadata.getColumns(connection.getCatalog(), null, "%", "%")) {
            while (columns.next()) {
                if (tableName.equalsIgnoreCase(columns.getString("TABLE_NAME"))
                        && columnName.equalsIgnoreCase(columns.getString("COLUMN_NAME"))) {
                    return true;
                }
            }
        }
        return false;
    }
}
