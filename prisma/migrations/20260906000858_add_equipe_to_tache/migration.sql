-- AlterTable
ALTER TABLE "Tache" ADD COLUMN     "equipeId" INTEGER;

-- AddForeignKey
ALTER TABLE "Tache" ADD CONSTRAINT "Tache_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "Equipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;
