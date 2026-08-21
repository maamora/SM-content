package com.maamora.studio.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
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
public class BrandSettingsSchemaMigration implements BeanFactoryPostProcessor {

    private static final String TABLE_NAME = "brand_settings";
    private static final String COLUMN_NAME = "configured";

    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {
        DataSource dataSource = beanFactory.getBean(DataSource.class);
        try (Connection connection = dataSource.getConnection()) {
            if (!tableExists(connection)) {
                return;
            }

            try (Statement statement = connection.createStatement()) {
                if (!columnExists(connection)) {
                    statement.execute("ALTER TABLE brand_settings ADD COLUMN configured BOOLEAN DEFAULT FALSE");
                    log.info("Added missing brand_settings.configured column for existing workspace data");
                }

                statement.executeUpdate("UPDATE brand_settings SET configured = FALSE WHERE configured IS NULL");
                statement.execute("ALTER TABLE brand_settings ALTER COLUMN configured SET DEFAULT FALSE");
                statement.execute("ALTER TABLE brand_settings ALTER COLUMN configured SET NOT NULL");
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Unable to repair brand_settings configured-column schema", exception);
        }
    }

    private boolean tableExists(Connection connection) throws SQLException {
        DatabaseMetaData metadata = connection.getMetaData();
        try (ResultSet tables = metadata.getTables(connection.getCatalog(), null, "%", new String[]{"TABLE"})) {
            while (tables.next()) {
                if (TABLE_NAME.equalsIgnoreCase(tables.getString("TABLE_NAME"))) {
                    return true;
                }
            }
        }
        return false;
    }

    private boolean columnExists(Connection connection) throws SQLException {
        DatabaseMetaData metadata = connection.getMetaData();
        try (ResultSet columns = metadata.getColumns(connection.getCatalog(), null, "%", "%")) {
            while (columns.next()) {
                if (TABLE_NAME.equalsIgnoreCase(columns.getString("TABLE_NAME"))
                        && COLUMN_NAME.equalsIgnoreCase(columns.getString("COLUMN_NAME"))) {
                    return true;
                }
            }
        }
        return false;
    }
}
