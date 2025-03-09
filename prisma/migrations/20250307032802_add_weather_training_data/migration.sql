-- CreateTable
CREATE TABLE "WeatherTrainingData" (
    "id" TEXT NOT NULL,
    "weatherData" JSONB NOT NULL,
    "treatmentType" TEXT NOT NULL,
    "effectiveness" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataQuality" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "validationScore" DOUBLE PRECISION,

    CONSTRAINT "WeatherTrainingData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeatherTrainingData_treatmentType_idx" ON "WeatherTrainingData"("treatmentType");

-- CreateIndex
CREATE INDEX "WeatherTrainingData_timestamp_idx" ON "WeatherTrainingData"("timestamp");
