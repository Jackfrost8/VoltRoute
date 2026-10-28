package com.voltroute.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI 3.0 & Swagger UI Configuration for VoltRoute Platform.
 * Configures global security schemes (Bearer JWT token authentication) and API metadata.
 */
@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "bearerAuth";

    @Bean
    public OpenAPI voltRouteOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("VoltRoute API")
                        .description("AI-powered EV Charging Station Finder and Intelligent Route Optimization Platform API")
                        .version("v0.1.0")
                        .contact(new Contact()
                                .name("VoltRoute Engineering Team")
                                .email("engineering@voltroute.internal"))
                        .license(new License().name("Apache 2.0").url("https://springdoc.org")))
                .externalDocs(new ExternalDocumentation()
                        .description("VoltRoute Architecture & Schema Documentation")
                        .url("https://github.com/voltroute/docs"))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
                                .name(SECURITY_SCHEME_NAME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Enter your JWT token in the format: Bearer <token>")));
    }
}
