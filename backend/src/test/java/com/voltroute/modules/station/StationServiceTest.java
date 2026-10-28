package com.voltroute.modules.station;

import com.voltroute.common.exception.BadRequestException;
import com.voltroute.common.exception.ResourceNotFoundException;
import com.voltroute.external.ocm.OpenChargeMapClient;
import com.voltroute.external.ocm.dto.*;
import com.voltroute.modules.station.dto.*;
import com.voltroute.modules.station.service.StationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StationServiceTest {

    @Mock
    private OpenChargeMapClient openChargeMapClient;

    @InjectMocks
    private StationService stationService;

    private OcmPoiResponse samplePoi;

    @BeforeEach
    void setUp() {
        samplePoi = OcmPoiResponse.builder()
                .id(101L)
                .uuid("UUID-101")
                .addressInfo(OcmAddressInfo.builder()
                        .title("Tesla Supercharger Richmond")
                        .addressLine1("1 N Morris St")
                        .town("Richmond")
                        .stateOrProvince("VA")
                        .postcode("23220")
                        .country(OcmCountry.builder().isoCode("US").title("United States").build())
                        .latitude(37.546347)
                        .longitude(-77.456361)
                        .distance(5.2)
                        .contactTelephone1("(804) 555-0199")
                        .accessComments("Open 24/7")
                        .build())
                .operatorInfo(OcmOperatorInfo.builder()
                        .title("Tesla")
                        .websiteUrl("https://www.tesla.com")
                        .build())
                .statusType(OcmStatusType.builder().id(50).title("Operational").isOperational(true).build())
                .connections(List.of(
                        OcmConnection.builder()
                                .id(1L)
                                .connectionTypeId(30)
                                .connectionType(OcmConnectionType.builder().id(30).title("Tesla Supercharger").formalName("Tesla").build())
                                .powerKw(250.0)
                                .quantity(8)
                                .statusType(OcmStatusType.builder().title("Operational").build())
                                .level(OcmLevel.builder().isFastChargeCapable(true).build())
                                .build(),
                        OcmConnection.builder()
                                .id(2L)
                                .connectionTypeId(33)
                                .connectionType(OcmConnectionType.builder().id(33).title("CCS (Type 2)").build())
                                .powerKw(150.0)
                                .quantity(4)
                                .build()
                ))
                .generalComments("High-speed charging hub")
                .build();
    }

    @Test
    @DisplayName("getNearbyStations - Valid coordinates returns mapped StationSummaryDto list")
    void getNearbyStations_shouldReturnMappedSummaries() {
        when(openChargeMapClient.getNearbyStations(eq(37.54), eq(-77.45), eq(10.0), anyInt(), isNull(), isNull()))
                .thenReturn(List.of(samplePoi));

        StationSearchFilter filter = StationSearchFilter.builder()
                .latitude(37.54)
                .longitude(-77.45)
                .radiusKm(10.0)
                .build();

        List<StationSummaryDto> results = stationService.getNearbyStations(filter);

        assertThat(results).hasSize(1);
        StationSummaryDto summary = results.get(0);
        assertThat(summary.getId()).isEqualTo(101L);
        assertThat(summary.getTitle()).isEqualTo("Tesla Supercharger Richmond");
        assertThat(summary.getOperatorName()).isEqualTo("Tesla");
        assertThat(summary.getMaxPowerKw()).isEqualTo(250.0);
        assertThat(summary.getTotalConnectors()).isEqualTo(12); // 8 + 4
        assertThat(summary.getConnectorTypes()).containsExactlyInAnyOrder("Tesla Supercharger", "CCS (Type 2)");
        assertThat(summary.isRealTimeOccupancyAvailable()).isFalse(); // Directory data, not live telemetry
    }

    @Test
    @DisplayName("getNearbyStations - Out of bounds coordinates throw BadRequestException")
    void getNearbyStations_shouldRejectInvalidCoordinates() {
        StationSearchFilter filterHighLat = StationSearchFilter.builder()
                .latitude(95.0)
                .longitude(10.0)
                .build();

        assertThatThrownBy(() -> stationService.getNearbyStations(filterHighLat))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Latitude must be between -90 and 90");

        StationSearchFilter filterHighLon = StationSearchFilter.builder()
                .latitude(45.0)
                .longitude(190.0)
                .build();

        assertThatThrownBy(() -> stationService.getNearbyStations(filterHighLon))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Longitude must be between -180 and 180");
    }

    @Test
    @DisplayName("getNearbyStations - Invalid radius throws BadRequestException")
    void getNearbyStations_shouldRejectInvalidRadius() {
        StationSearchFilter filterZeroRadius = StationSearchFilter.builder()
                .latitude(37.0)
                .longitude(-122.0)
                .radiusKm(0.0)
                .build();

        assertThatThrownBy(() -> stationService.getNearbyStations(filterZeroRadius))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Search radius must be between 0.1 and 200.0");

        StationSearchFilter filterExcessRadius = StationSearchFilter.builder()
                .latitude(37.0)
                .longitude(-122.0)
                .radiusKm(250.0)
                .build();

        assertThatThrownBy(() -> stationService.getNearbyStations(filterExcessRadius))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Search radius must be between 0.1 and 200.0");
    }

    @Test
    @DisplayName("getNearbyStations - Empty external response returns empty list without fabrication")
    void getNearbyStations_shouldHandleEmptyResponseWithoutFabrication() {
        when(openChargeMapClient.getNearbyStations(anyDouble(), anyDouble(), anyDouble(), anyInt(), any(), any()))
                .thenReturn(List.of());

        StationSearchFilter filter = StationSearchFilter.builder()
                .latitude(37.54)
                .longitude(-77.45)
                .radiusKm(10.0)
                .build();

        List<StationSummaryDto> results = stationService.getNearbyStations(filter);

        assertThat(results).isEmpty();
    }

    @Test
    @DisplayName("getStationById - Existing ID returns detailed StationDetailDto")
    void getStationById_shouldReturnStationDetail() {
        when(openChargeMapClient.getStationById(101L)).thenReturn(Optional.of(samplePoi));

        StationDetailDto detail = stationService.getStationById(101L);

        assertThat(detail.getId()).isEqualTo(101L);
        assertThat(detail.getTitle()).isEqualTo("Tesla Supercharger Richmond");
        assertThat(detail.getOperatorWebsite()).isEqualTo("https://www.tesla.com");
        assertThat(detail.getContactTelephone()).isEqualTo("(804) 555-0199");
        assertThat(detail.getConnectors()).hasSize(2);
        assertThat(detail.getConnectors().get(0).isFastChargeCapable()).isTrue();
        assertThat(detail.isRealTimeOccupancyAvailable()).isFalse();
    }

    @Test
    @DisplayName("getStationById - Non-existent ID throws ResourceNotFoundException")
    void getStationById_shouldThrowWhenNotFound() {
        when(openChargeMapClient.getStationById(9999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> stationService.getStationById(9999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Station not found");
    }

    @Test
    @DisplayName("searchStations - City search filters stations matching town name")
    void searchStations_shouldFilterByTown() {
        when(openChargeMapClient.getStationsByCountry(eq("US"), anyInt(), any(), any()))
                .thenReturn(List.of(samplePoi));

        StationSearchFilter filter = StationSearchFilter.builder()
                .city("Richmond")
                .countryCode("US")
                .build();

        List<StationSummaryDto> results = stationService.searchStations(filter);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getLocation().getCity()).isEqualTo("Richmond");
    }

    @Test
    @DisplayName("searchStations - City search without country code or coordinates throws BadRequestException")
    void searchStations_shouldRequireCountryCodeWhenCoordinatesAbsent() {
        StationSearchFilter filter = StationSearchFilter.builder()
                .city("Berlin")
                .build();

        assertThatThrownBy(() -> stationService.searchStations(filter))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Country code");
    }
}
