import airportArt from '@/assets/practical-english/airport.svg'
import hotelArt from '@/assets/practical-english/hotel.svg'
import foodArt from '@/assets/practical-english/food-and-drink.svg'
import shoppingArt from '@/assets/practical-english/shopping.svg'
import transportationArt from '@/assets/practical-english/transportation.svg'
import meetingArt from '@/assets/practical-english/meeting-people.svg'
import healthArt from '@/assets/practical-english/health-and-emergencies.svg'
import cityArt from '@/assets/practical-english/around-the-city.svg'
import type { SituationCategoryId } from '@/types/practical-english'

const illustrations: Record<SituationCategoryId, string> = {
  airport: airportArt,
  hotel: hotelArt,
  'food-and-drink': foodArt,
  shopping: shoppingArt,
  transportation: transportationArt,
  'meeting-people': meetingArt,
  'health-and-emergencies': healthArt,
  'around-the-city': cityArt,
}

export function SituationIllustration({
  category,
  className,
}: {
  category: SituationCategoryId
  className: string
}) {
  return (
    <img
      src={illustrations[category]}
      alt=""
      width={360}
      height={144}
      className={className}
    />
  )
}
